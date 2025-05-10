"use strict";

import fastify, { FastifyInstance } from 'fastify';
import { serverLogger } from "./core/utils/logger/serverLogger";
import { ServerError, ErrorCodes, handleError } from "./core/utils/errors/errorHandler";
import { drainRedisPool } from "./core/caching/redisConnectionHandler";
import { Server, IncomingMessage, ServerResponse } from 'http';
import { FastifyBaseLogger } from 'fastify';

// Fastify Plugins
import fastifyCookie from '@fastify/cookie';
import fastifyCompress from '@fastify/compress';
import fastifyUrlData from '@fastify/url-data';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import fastifySensible from '@fastify/sensible';
import { errorHandlerMiddleware } from './shared/middleware/globalErrorHandler';
import { loadMonitorPlugin } from './plugins/setup/plg-loadMonitor';
import { rateLimitPlugin } from './plugins/setup/plg-rateLimit';
import { corsPlugin } from './plugins/setup/plg-cors';
import { metricsPlugin } from './plugins/setup/plg-metrics';
import { helmetPlugin } from './plugins/setup/plg-helmet';
import { configPlugin } from './plugins/setup/plg-config';
import { redisPlugin } from './plugins/cache/plg-redis';
import loggerPlugin from './plugins/setup/plg-logger';
import { responseFormatterPlugin } from './plugins/setup/plg-response';
import { routes } from './routes';
import { fastifySwagger } from '@fastify/swagger';

export async function startServer(): Promise<FastifyInstance<
	Server,
	IncomingMessage,
	ServerResponse,
	FastifyBaseLogger,
	TypeBoxTypeProvider
>> {
	try {
		const port = process.env.PORT || 3001;

		// Initialize Fastify with TypeBox for improved type safety
		const server = fastify({
			logger: false,
			trustProxy: true,
			bodyLimit: 10 * 1024 * 1024, // 10MB
			maxParamLength: 100, // Limit parameter length for security
			connectionTimeout: 30000, // 30 seconds
			keepAliveTimeout: 30000, // 30 seconds
			pluginTimeout: 50000, // 50 seconds
			requestTimeout: 30000, // 30 seconds
			ajv: {
				customOptions: {
					removeAdditional: 'all',
					coerceTypes: true,
					useDefaults: true,
					allErrors: true, // Collect all errors, not just the first one
					validateFormats: true, // Ensure strict format validation
				}
			},
			ignoreTrailingSlash: true, // Treat /foo and /foo/ as the same route
			caseSensitive: true, // Enforce case sensitivity for routes
			return503OnClosing: true, // Return 503 when server is closing
			disableRequestLogging: false, // Keep request logging enabled
			onProtoPoisoning: 'remove', // Protection against prototype poisoning
			onConstructorPoisoning: 'remove', // Protection against constructor poisoning
			serializerOpts: {
				rounding: 'ceil', // Consistent number serialization
				bigint: false, // Disable BigInt serialization for compatibility
			}
		}).withTypeProvider<TypeBoxTypeProvider>();

		// Core plugins first
		await server.register(configPlugin);
		await server.register(loggerPlugin);
		await server.register(responseFormatterPlugin);

		// Security plugins
		await server.register(helmetPlugin);
		await server.register(rateLimitPlugin);
		await server.register(corsPlugin);

		// Utility plugins
		await server.register(fastifyCookie);
		await server.register(fastifyCompress);
		await server.register(fastifySensible);
		await server.register(fastifyUrlData);

		// Database and cache
		await server.register(redisPlugin);

		// Monitoring plugins
		await server.register(loadMonitorPlugin);
		await server.register(metricsPlugin);

		// Documentation - must be registered before routes
		// Register Swagger documentation
		await server.register(fastifySwagger, {
			openapi: {
				openapi: '3.0.3',
				info: {
					title: 'Noir API Documentation',
					description: 'Workflow Automation Engine API documentation',
					version: '1.0.0',
					contact: {
						name: 'API Support',
						url: 'https://github.com/yourusername/trc',
						email: 'your-email@example.com'
					},
					license: {
						name: 'MIT',
						url: 'https://opensource.org/licenses/MIT'
					}
				},
				servers: [{
					url: `http://localhost:${server.config.PORT}`,
					description: 'Development server'
				}],
				tags: [
					{ name: 'workflows', description: 'Workflow management endpoints' },
					{ name: 'node-types', description: 'Node type management endpoints' },
					{ name: 'credentials', description: 'Credential management endpoints' },
					{ name: 'variables', description: 'Variable management endpoints' },
					{ name: 'audit', description: 'Audit log endpoints' },
					{ name: 'webhooks', description: 'Webhook management endpoints' }
				],
				components: {
					securitySchemes: {
						bearerAuth: {
							type: 'http',
							scheme: 'bearer',
							bearerFormat: 'JWT'
						},
						apiKey: {
							type: 'apiKey',
							name: 'x-api-key',
							in: 'header'
						}
					},
					schemas: {
						Error: {
							type: 'object',
							properties: {
								statusCode: { type: 'integer' },
								error: { type: 'string' },
								message: { type: 'string' }
							}
						}
					}
				}
			},
			hideUntagged: true,
		});

		// Routes - register last
		await server.register(routes);

		await server.register(require('@scalar/fastify-api-reference'), {
			routePrefix: '/documentation/',
			hooks: {
				onRequest: function (request, reply, done) {
					done()
				},
				preHandler: function (request, reply, done) {
					done()
				},
			},
		})
		// Global error handler
		server.setErrorHandler(errorHandlerMiddleware);

		await server.ready();
		// Start the server
		await server.listen({
			port: parseInt(server.config.PORT.toString()),
			host: '0.0.0.0'
		});

		serverLogger.trace(`Worker Process listening on Port: ${port} || PID: ${process.pid}`, {
			operation: "LISTEN",
			indexPrefix: "SYSTEM",
		});

		// Graceful shutdown handler
		const gracefulShutdown = async (signal: string) => {
			serverLogger.info(`Initiating graceful shutdown: ${signal}`, {
				indexPrefix: "SYSTEM",
				operation: "SHUTDOWN"
			});

			await server.close();

			try {
				await Promise.all([
					drainRedisPool(),
				]);

				serverLogger.info(`Worker ${process.pid} cleanup completed`, {
					indexPrefix: "SYSTEM",
					operation: "SHUTDOWN"
				});

				process.exit(0);
			} catch (error) {
				serverLogger.error(`Worker ${process.pid} shutdown error: ${error}`, {
					indexPrefix: "SYSTEM",
					operation: "SHUTDOWN"
				});
				process.exit(1);
			}
		};
		// Process event handlers
		process.on('message', (msg: any) => {
			if (msg.type === 'shutdown') {
				gracefulShutdown('shutdown message');
			}
		});

		process.on("unhandledRejection", async (reason: any, promise: Promise<any>) => {
			serverLogger.fatal(`Unhandled Rejection at: ${reason.message} -- ${reason.stack}`, {
				operation: "UNHANDLED_REJECTION",
				promise,
				reason,
				indexPrefix: "SYSTEM"
			});
			await gracefulShutdown("unhandledRejection");
		});

		process.on("uncaughtException", async (error: Error) => {
			serverLogger.fatal(`Uncaught Exception:`, {
				operation: "UNHANDLED_EXCEPTIONS",
				error,
				indexPrefix: "SYSTEM"
			});
			await gracefulShutdown("uncaughtException");
		});

		/**
		 * Exit Handlers
		 */
		process.on("beforeExit", async (code) => {
			await gracefulShutdown(`beforeExit with code: ${code}`);
		});

		process.on("exit", (code) => {
			console.log(`Process exited with code: ${code}`);
		});

		process.on("SIGINT", async () => {
			await gracefulShutdown("SIGINT");
			process.exit();
		});

		process.on("SIGTERM", async () => {
			await gracefulShutdown("SIGTERM");
			process.exit();
		});
		// Store server instance globally if needed
		global.server = server;
		process.setMaxListeners(100);
		return server;
	} catch (err) {
		handleError({ err, isFatal: true, shouldLog: true, shouldThrow: true });
		process.exit(1);
	}
}
