import { FastifyInstance } from "fastify";
import fastifyMetrics from "fastify-metrics";
export async function metricsPlugin(server: FastifyInstance) {
    // Metrics configuration
    await server.register(fastifyMetrics, {
        endpoint: '/metrics',
        name: 'noi_metrics',
        routeMetrics: {
            enabled: true,
            groupStatusCodes: true,
        },
        defaultMetrics: {
            enabled: true,
            eventLoopMonitoringPrecision: 1000,
            gcDurationBuckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
        }
    });
}