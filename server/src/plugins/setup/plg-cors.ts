import fastifyCors from "@fastify/cors";
import { FastifyInstance } from "fastify";

export async function corsPlugin(server: FastifyInstance) {
    // CORS with more detailed configuration
    await server.register(fastifyCors, {
        origin: server.config.SERVER.CORS_ORIGIN.split(',') || '*',
        methods: server.config.SERVER.CORS_METHODS.split(','),
        allowedHeaders: server.config.SERVER.CORS_ALLOWED_HEADERS.split(','),
        credentials: server.config.SERVER.CORS_CREDENTIALS,
        maxAge: server.config.SERVER.CORS_MAX_AGE,
    });
}