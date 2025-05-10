import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { config } from '@/core/boot/configValidator'
// Extend FastifyInstance to include our config
declare module 'fastify' {
    interface FastifyInstance {
        config: typeof config
    }
}

const configurationPlugin: FastifyPluginAsync = async (fastify) => {
    fastify.decorate('config', config)
}

export const configPlugin = fp(configurationPlugin, {
    name: 'config'
})
