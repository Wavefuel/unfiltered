import fastifyRateLimit from "@fastify/rate-limit";
import { FastifyInstance } from "fastify";

export async function rateLimitPlugin(server: FastifyInstance) {
    // Rate limiting with more detailed configuration
    await server.register(fastifyRateLimit, {
        max: server.config.SERVER.RATE_LIMIT,
        timeWindow: server.config.SERVER.RATE_LIMIT_WINDOW_MS,
        allowList: ['127.0.0.1'],
        redis: global.redisClient, // If you're using Redis for rate limiting
        errorResponseBuilder: function (request, context) {
            return {
                code: 429,
                error: 'Too Many Requests',
                message: `Rate limit exceeded, retry in ${context.after}`,
                date: Date.now(),
                expiresIn: context.after
            }
        }
    });
}