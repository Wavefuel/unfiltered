import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

// Extend FastifyReply interface
declare module 'fastify' {
    interface FastifyReply {
        json: (data: any, opts?: {
            message?: string;
            error?: Error;
            cache?: boolean;
            status?: number;
        }) => FastifyReply
    }
}

const responsePlugin: FastifyPluginAsync = async (fastify, options) => {
    // Exclude certain routes if needed
    const excludedRoutes = ['/hooks/ask/skills/handler', '/documentation/json', '/documentation',
        '/documentation/yaml',
        '/documentation/static',
        '/documentation/initOAuth',
        '/documentation/uiConfig', '/openapi.json', '/documentation/openapi.json']

    // Add a decorator to FastifyReply
    fastify.decorateReply('json', function (data: any, opts: {
        message?: string;
        error?: Error;
        cache?: boolean;
        status?: number;
    } = {}) {
        const timestamp = new Date().toUTCString()
        const statusCode = this.statusCode || 200

        const payload = {
            ...data,
            status: statusCode || data.status || 200,
            customStatus: opts.status || data.status,
            timestamp,
            cache: opts.cache || data.cache || false,
            error: opts.error || data.error || null,
            message: opts.message || data.message || (opts.error ? opts.error.message : null)
        }

        return this.send(payload)
    })
    // Add hook to intercept all responses
    fastify.addHook('onSend', async (request, reply, payload) => {
        if (excludedRoutes.includes(request.url)) {
            return payload
        }

        // Only transform JSON responses that haven't used customSend
        if (reply.hasHeader('content-type') && reply.getHeader('content-type')?.toString().includes('application/json')) {
            try {
                const parsedPayload = JSON.parse(payload as string)
                const timestamp = new Date().toUTCString()

                return JSON.stringify({
                    data: parsedPayload,
                    status: reply.statusCode,
                    timestamp,
                    cache: false,
                    error: null,
                    message: null
                })
            } catch (err) {
                // If payload is not JSON, return it as-is
                return payload
            }
        }

        return payload
    })
}

export const responseFormatterPlugin = fp(responsePlugin, {
    name: 'response-formatter',
    dependencies: ['config']
})