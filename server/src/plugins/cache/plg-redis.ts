import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { redisPool, initializeRedisPool, drainRedisPool } from '../../core/caching/redisConnectionHandler';
import { handleCacheData, handleProducerData, ProducerPayload } from '../../core/caching/mw-cache';
import { ErrorCodes, ServerError } from '../../core/utils/errors/errorHandler';
import { FastifyInstance } from 'fastify';
import { serverLogger } from '@/core/utils/logger/serverLogger';

declare module 'fastify' {
    interface FastifyInstance {
        redis: {
            pool: typeof redisPool;
            cache: {
                read(set: { key: string; data?: any }[]): Promise<any[] | undefined>;
                readHistory(set: { key: string; data?: any }[]): Promise<any[] | undefined>;
                write(set: { key: string; data?: any }[], expireInSeconds?: number): Promise<void | undefined>;
                delete(set: { key: string; data?: any }[]): Promise<void | undefined>;
            };
            producer: {
                publish(payloads: ProducerPayload[]): Promise<any[] | undefined>;
            };
        };
    }
}

// Define the type for our Redis decorator
interface RedisDecorator {
    pool: typeof redisPool;
    cache: {
        read(set: { key: string; data?: any }[]): Promise<any[] | undefined>;
        readHistory(set: { key: string; data?: any }[]): Promise<any[] | undefined>;
        write(set: { key: string; data?: any }[], expireInSeconds?: number): Promise<any[] | undefined>;
        delete(set: { key: string; data?: any }[]): Promise<any[] | undefined>;
    };
    producer: {
        publish(payloads: ProducerPayload[]): Promise<any[] | undefined>;
    };
}

const redisCachePlugin: FastifyPluginAsync = async (fastify, options) => {
    try {
        // Initialize Redis pool when plugin starts
        await initializeRedisPool();

        // Add hook to check Redis health during requests
        fastify.addHook('onRequest', async (request, reply) => {
            const isHealthy = await redisPool.healthCheck();
            if (!isHealthy) {
                throw new ServerError('Redis service is unavailable', ErrorCodes.FAILED_TO_CONNECT_TO_REDIS);
            }
        });

        // Cleanup Redis connections when Fastify closes
        fastify.addHook('onClose', async (instance) => {
            await drainRedisPool();
        });

        // Add Redis functionality to Fastify instance with proper typing
        fastify.decorate<RedisDecorator>('redis', {
            pool: redisPool,
            cache: {
                read: async (set) => await handleCacheData('Read', set),
                readHistory: async (set) => await handleCacheData('ReadHistory', set),
                write: async (set, expireInSeconds) => await handleCacheData('Write', set, expireInSeconds),
                delete: async (set) => await handleCacheData('Delete', set),
            },
            producer: {
                publish: async (payloads) => await handleProducerData(payloads),
            },
        });
    } catch (error) {
        serverLogger.error(`Failed to initialize Redis pool: ${error}`, { operation: "REDIS", indexPrefix: "SYSTEM" });
        // throw new ServerError("Failed to initialize Redis pool", ErrorCodes.INTERNAL_SERVER_ERROR, { operation: "REDIS" });
    }
};

export const redisPlugin = fp(redisCachePlugin, {
    name: 'redis',
    dependencies: ['config'],
});