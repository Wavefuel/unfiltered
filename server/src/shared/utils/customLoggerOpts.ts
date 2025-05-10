import { serverLogger } from "@/core/utils/logger/serverLogger";

export const customLoggerOpts = {
    level: process.env.LOG_LEVEL || 'info',
    // Override the default logger with your custom one
    transport: {
        target: 'pino-pretty',
        options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
        }
    },
    // Custom serializers for your logger
    serializers: {
        req(request) {
            return {
                method: request.method,
                url: request.url,
                path: request.routerPath,
                parameters: request.params,
                headers: request.headers
            };
        },
        res(reply) {
            return {
                statusCode: reply.statusCode
            };
        }
    },
    // Override the default logger methods with your custom ones
    stream: {
        write: (msg) => {
            const logData = JSON.parse(msg);
            // Map Fastify log levels to your logger's methods
            switch (logData.level) {
                case 30: // info
                    serverLogger.info(logData.msg, {
                        indexPrefix: "SYSTEM",
                        operation: "SERVER",
                        context: logData
                    });
                    break;
                case 40: // warn
                    serverLogger.warn(logData.msg, {
                        indexPrefix: "SYSTEM",
                        operation: "SERVER",
                        context: logData
                    });
                    break;
                case 50: // error
                    serverLogger.error(logData.msg, {
                        indexPrefix: "SYSTEM",
                        operation: "SERVER",
                        context: logData
                    });
                    break;
                case 60: // fatal
                    serverLogger.fatal(logData.msg, {
                        indexPrefix: "SYSTEM",
                        operation: "SERVER",
                        context: logData
                    });
                    break;
                default: // trace/debug
                    serverLogger.trace(logData.msg, {
                        indexPrefix: "SYSTEM",
                        operation: "SERVER",
                        context: logData
                    });
            }
        }
    }
}