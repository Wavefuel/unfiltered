import fastifyHelmet from "@fastify/helmet";
import { FastifyInstance } from "fastify";

export async function helmetPlugin(server: FastifyInstance) {
    await server.register(fastifyHelmet, {
        global: true,
        crossOriginResourcePolicy: { policy: "cross-origin" },
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https:"],
            }
        }
    });
}