import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { serverLogger } from '@/core/utils/logger/serverLogger';

const loggerPlugin: FastifyPluginAsync = fp(async (fastify) => {
    // Server Lifecycle Hooks
    fastify.addHook('onReady', async function () {
        serverLogger.trace('Server is ready', {
            indexPrefix: "SYSTEM",
            operation: "SERVER_READY",
            context: {
                pid: process.pid,
                address: fastify.server.address(),
            }
        });
    });

    fastify.addHook('onClose', async function (instance) {
        serverLogger.trace('Server is shutting down', {
            indexPrefix: "SYSTEM",
            operation: "SERVER_SHUTDOWN",
            context: {
                pid: process.pid,
                address: instance.server.address()
            }
        });
    });

    // Request Lifecycle Hooks (in order of execution)
    fastify.addHook('onRequest', async (request, reply) => {
        request.requestStartTime = Date.now(); // For tracking total request time
        serverLogger.trace(`Incoming ${request.method} request to ${request.url}`, {
            indexPrefix: "SYSTEM",
            operation: "REQUEST",
            context: {
                method: request.method,
                url: request.url,
                headers: request.headers,
                params: request.params,
                query: request.query,
                ip: request.ip,
                hostname: request.hostname,
                protocol: request.protocol,
                id: request.id
            }
        });
    });

    fastify.addHook('onResponse', async (request, reply) => {
        const totalTime = Date.now() - (request.requestStartTime || Date.now());
        serverLogger.trace(`Response sent for ${request.method} ${request.url}`, {
            indexPrefix: "SYSTEM",
            operation: "RESPONSE",
            context: {
                method: request.method,
                url: request.url,
                statusCode: reply.statusCode,
                responseTime: reply.elapsedTime,
                totalProcessingTime: totalTime,
                requestId: request.id,
                contentLength: reply.getHeader('content-length'),
                contentType: reply.getHeader('content-type')
            }
        });
    });

    fastify.addHook('onError', async (request, reply, error) => {
        serverLogger.error(`Error processing ${request.method} ${request.url}`, {
            indexPrefix: "SYSTEM",
            operation: "ERROR",
            context: {
                method: request.method,
                url: request.url,
                statusCode: reply.statusCode,
                requestId: request.id,
                errorName: error.name,
                errorMessage: error.message,
                errorStack: error.stack,
                validationErrors: error.validation || [],
                code: error.code,
                cause: error.cause, // Shows which hook caused the error
                requestBody: request.body,
                requestHeaders: request.headers
            }
        });
    });

    // Only log debug messages in development
    if (fastify.config.NODE_ENV === 'development') {

        fastify.addHook('onRoute', (routeOptions) => {
            serverLogger.debug(`Route registered: ${routeOptions.url}`, {
                indexPrefix: "SYSTEM",
                operation: "ROUTE_REGISTER",
                context: {
                    method: routeOptions.method,
                    url: routeOptions.url,
                    schema: routeOptions.schema,
                    handler: routeOptions.handler.name
                }
            });
        });

        fastify.addHook('onRegister', (instance, opts) => {
            serverLogger.debug(`Plugin registered: ${instance.pluginName}`, {
                indexPrefix: "SYSTEM",
                operation: "PLUGIN_REGISTER",
                context: {
                    name: instance.pluginName,
                    options: opts
                }
            });
        });
    }
}, {
    name: 'logger',
    dependencies: ['config'],
});

// Add TypeScript declaration for the custom property
declare module 'fastify' {
    interface FastifyRequest {
        requestStartTime?: number;
    }
}

export default loggerPlugin; 