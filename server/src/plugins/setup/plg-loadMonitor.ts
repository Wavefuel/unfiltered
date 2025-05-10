import { serverLogger } from "@/core/utils/logger/serverLogger";
import fastifyUnderPressure from "@fastify/under-pressure";
import { FastifyInstance, FastifyRequest } from "fastify";

export async function loadMonitorPlugin(server: FastifyInstance) {
    await server.register(fastifyUnderPressure, {
        maxEventLoopDelay: 1000,  // 1 second max delay
        maxHeapUsedBytes: Math.floor(process.memoryUsage().heapTotal * 0.9), // 90% of max heap
        maxRssBytes: 1024 * 1024 * 1024 * 2, // 2GB RSS,
        maxEventLoopUtilization: 0.98,
        pressureHandler: loadMonitorPressureHandler,
        exposeStatusRoute: false,
        healthCheck: loadMonitorHealthCheck,
        healthCheckInterval: 30000  // Check every 5 seconds
    });

    // Add custom status route
    server.get('/status', async (request, reply) => {
        const health = await loadMonitorHealthCheck(server);
        const memUsage = process.memoryUsage();

        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            redisStatus: health.redisStatus,
            metrics: {
                memory: {
                    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                    rss: Math.round(memUsage.rss / 1024 / 1024),
                    percentage: `${((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(2)}%`
                },
                ...health.metrics,
                activeConnections: server.server.connections
            }
        };
    });
}

export const loadMonitorPressureHandler = (req, rep, type, value) => {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Enhanced logging with more metrics
    serverLogger.warn('Server under pressure', {
        ref: {
            pressureData: {
                type,
                value,
                endpoint: req.url,
                method: req.method,
                memoryUsage: {
                    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                    percentage: `${((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(2)}%`
                },
                cpuUsage: {
                    user: cpuUsage.user,
                    system: cpuUsage.system,
                    total: cpuUsage.user + cpuUsage.system
                },
            }
        },
        operation: 'LOAD_MONITOR',
        indexPrefix: 'SYSTEM'
    });

    rep.code(503).send({
        statusCode: 503,
        error: 'Service Unavailable',
        message: 'Server is under high load, please try again later'
    });
}

export const loadMonitorHealthCheck = async (fastifyInstance) => {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Sample 1% of health checks for detailed logging
    if (Math.random() < 0.01) {
        serverLogger.info('Server health statistics', {
            ref: {
                memoryUsage: {
                    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                    percentage: `${((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(2)}%`
                },
                cpuUsage: {
                    user: cpuUsage.user,
                    system: cpuUsage.system,
                    total: cpuUsage.user + cpuUsage.system
                },
                uptime: process.uptime()
            },
            operation: 'HEALTH_CHECK',
            indexPrefix: 'SYSTEM'
        });
    }

    return {
        redisStatus: await checkRedisConnection(fastifyInstance),
        metrics: {
            ...fastifyInstance.memoryUsage(),
            cpuUsage,
            heapUsagePercentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
        }
    };
}


export async function checkRedisConnection(fastifyInstance: FastifyInstance): Promise<string> {
    try {
        const redis = fastifyInstance.redis;
        return 'Connected';
    } catch {
        return 'Disconnected';
    }
}