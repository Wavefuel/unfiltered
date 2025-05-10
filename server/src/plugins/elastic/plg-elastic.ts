import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { Client } from '@elastic/elasticsearch';
import { ElasticController } from '@/core/elastic/controller/elasticController';
import { serverLogger } from '@/core/utils/logger/serverLogger';
import { ErrorCodes, ServerError } from '@/core/utils/errors/errorHandler';

// Extend FastifyInstance to include our ElasticController
declare module 'fastify' {
    interface FastifyInstance {
        elastic: {
            client: Client;
            controller: ElasticController;
        }
    }
}

const elasticSearchPlugin: FastifyPluginAsync = async (fastify, options) => {
    try {
        // Initialize Elasticsearch client
        const client = new Client({
            node: fastify.config.HALO.ELASTICSEARCH_URL || 'http://localhost:9200',
            auth: {
                username: fastify.config.HALO.ELASTICSEARCH_USERNAME,
                password: fastify.config.HALO.ELASTICSEARCH_PASSWORD
            },
            maxRetries: 3,
            requestTimeout: 30000,
        });

        // Initialize ElasticController with configuration
        const controller = new ElasticController(client, {
            defaultIndex: fastify.config.HALO.ANALYTICS_ES_INDEX_PREFIX,
            defaultSize: 10,
            defaultTimeout: 30000,
            maxRetries: 3,
            enableCache: true,
            cacheTTL: 60000,
            defaultTextField: 'text',
        });

        // Test connection
        await client.ping();
        serverLogger.info('Connected to Elasticsearch', {
            operation: 'ELASTIC_INIT',
            indexPrefix: 'SYSTEM'
        });

        // Add hook to check Elasticsearch health during requests
        fastify.addHook('onRequest', async (request, reply) => {
            try {
                const health = await client.cluster.health({});
                if (health.status === 'red') {
                    throw new ServerError('Elasticsearch cluster is in red status', ErrorCodes.ELASTICSEARCH_NOT_CONFIGURED);
                }
            } catch (error) {
                // Don't throw on health check to avoid breaking all requests
                serverLogger.warn('Elasticsearch health check failed', {
                    operation: 'ELASTIC_HEALTH',
                    indexPrefix: 'SYSTEM',
                    context: { error }
                });
            }
        });

        // Cleanup connections when Fastify closes
        fastify.addHook('onClose', async (instance) => {
            try {
                await client.close();
                serverLogger.info('Elasticsearch connection closed', {
                    operation: 'ELASTIC_CLOSE',
                    indexPrefix: 'SYSTEM'
                });
            } catch (error) {
                serverLogger.error('Error closing Elasticsearch connection', {
                    operation: 'ELASTIC_CLOSE',
                    indexPrefix: 'SYSTEM',
                    context: { error }
                });
            }
        });

        // Add Elasticsearch functionality to Fastify instance
        fastify.decorate('elastic', {
            client,
            controller
        });

    } catch (error) {
        serverLogger.error('Failed to initialize Elasticsearch', {
            operation: 'ELASTIC_INIT',
            indexPrefix: 'SYSTEM',
            context: { error }
        });
        throw new ServerError('Failed to initialize Elasticsearch', ErrorCodes.ELASTICSEARCH_NOT_CONFIGURED, { operation: 'ELASTIC_INIT' });
    }
};

export const elasticPlugin = fp(elasticSearchPlugin, {
    name: 'elastic',
    dependencies: ['config']
});
