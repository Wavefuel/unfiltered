import { apmService } from "./src/core/elastic/apm";

//Initialize Server Specific Packages
import cluster from "cluster";
import { v4 as uuidv4 } from "uuid";
import { startServer } from "./src/server";
import { serverLogger } from "./src/core/utils/logger/serverLogger";

import { ErrorCodes, ServerError } from "./src/core/utils/errors/errorHandler";
import { handleLogArchival } from "./src/core/cron/logArchiver";
import os from "os";
import { bootLoader } from "./src/core/boot";
import path from "path";
import { generateManifest } from "./src/core/manifest";
import { drainRedisPool, initializeRedisPool } from "./src/core/caching/redisConnectionHandler";

//Constants for Cluster
const port = process.env.PORT || 3001;
const numCPUs = os.cpus().length;
const outputPath = path.resolve(__dirname, "./src/core/manifest", `${process.env.APPLICATION_CODE}-apiRouteManifest.json`);

// At the top of the file, add a shutdown flag for the primary process
let isClusterShuttingDown = false;

try {
    //Spool Cluster Logic
    if (process.env.NODE_ENV === "production") {
        // Track online workers
        let onlineWorkerCount = 0;
        if (cluster.isPrimary) {
            cluster.schedulingPolicy = cluster.SCHED_RR;
            // Fork workers
            bootLoader(true, "unf")
                .then(async () => {
                    // if (process.env.ORGANIZATION) {
                    serverLogger.trace(`UNF-Server Master Process is running on PORT:${port} | PID:${process.pid}, on ${numCPUs} CPU Cores.`, {
                        operation: "BOOT",
                        indexPrefix: "SYSTEM",
                    });

                    for (let i = 0; i < numCPUs; i++) {
                        cluster.fork();
                    }
                    // } else {
                    // 	serverLogger.fatal("Something went wrong during initialization of the application, could not Authenticate Organization.", {
                    // 		operation: "BOOT",
                    // 		indexPrefix: "SYSTEM",
                    // 	});
                    // 	process.exit(1);
                    // }
                })
                .catch((err) => {
                    serverLogger.fatal(`Integrity compromised, process failed, contact Wavefuel Solutions for further help: ${err.message}`, {
                        operation: "BOOT",
                        indexPrefix: "SYSTEM",
                    });
                    process.exit(1);
                })
                .finally(async () => {
                    initializeRedisPool()
                        .then(() => {
                        })
                        .catch((err) => {
                            serverLogger.fatal(`Error initializing Redis Pool: ${err}`, {
                                indexPrefix: "SYSTEM",
                                operation: "REDIS",
                            });
                            process.exit(1);
                        });
                });

            // Listen for messages from workers
            cluster.on("message", async (worker, message) => {
                if (message.type === "request") {
                    if (!message.receiverPID) {
                        //? Send a message to all the processes.
                        try {
                            const responsePromises = Object.values(cluster.workers!)
                                .filter((e) => e && e.process.pid !== worker.process.pid)
                                .map((otherWorker) => {
                                    return new Promise((resolve, reject) => {
                                        let timeout: Record<string, any> = {
                                            value: undefined,
                                        };
                                        const messageHandler = (worker: any, response: any) => {
                                            if (response.id === message.id) {
                                                clearTimeout(timeout.value);
                                                cluster!.off("message", messageHandler);
                                                resolve(response);
                                            }
                                        };
                                        timeout.value = setTimeout(() => {
                                            cluster!.off("message", messageHandler);
                                            reject({
                                                reason: "No response was received!",
                                            });
                                        }, 60000);
                                        cluster!.on("message", messageHandler);
                                        otherWorker?.send(message);
                                    });
                                });
                            let responses = await Promise.all(responsePromises);
                            let responseProcess = Object.values(cluster.workers!).find((e) => e && e.process.pid === worker.process.pid);
                            if (responseProcess) {
                                responseProcess!.send({
                                    pid: process.pid,
                                    topic: "response",
                                    message: responses,
                                    id: message.id,
                                });
                            }
                        } catch (err) {
                            let responseProcess = Object.values(cluster.workers!).find((e) => e && e.process.pid === worker.process.pid);
                            if (responseProcess) {
                                responseProcess!.send({
                                    pid: process.pid,
                                    topic: "error",
                                    message: err,
                                    id: message.id,
                                });
                            }
                        }
                    } else {
                        {
                            //? Send a message to a specific processes.
                            try {
                                let receiverProcess = Object.values(cluster.workers!).find((e) => e && e.process.pid === message.receiverPID);
                                if (receiverProcess) {
                                    const response: any = await new Promise((resolve, reject) => {
                                        let timeout: Record<string, any> = {
                                            value: undefined,
                                        };
                                        const messageHandler = (worker: any, response: any) => {
                                            if (response.id === message.id && response.type === "response") {
                                                clearTimeout(timeout.value);
                                                cluster!.off("message", messageHandler);
                                                resolve(response);
                                            }
                                        };
                                        timeout.value = setTimeout(() => {
                                            cluster!.off("message", messageHandler);
                                            reject({
                                                reason: "No response was received!",
                                            });
                                        }, 60000);
                                        cluster!.on("message", messageHandler);
                                        receiverProcess!.send(message);
                                    });
                                    let responseProcess = Object.values(cluster.workers!).find((e) => e && e.process.pid === worker.process.pid);
                                    if (responseProcess) {
                                        responseProcess.send({
                                            pid: process.pid,
                                            topic: "response",
                                            message: response.message,
                                            id: message.id,
                                        });
                                    }
                                } else {
                                    worker.send({
                                        pid: process.pid,
                                        topic: "error",
                                        message: "The requested process is unavailable",
                                        id: message.id,
                                    });
                                }
                            } catch (err) {
                                let responseProcess = Object.values(cluster.workers!).find((e) => e && e.process.pid === worker.process.pid);
                                if (responseProcess) {
                                    responseProcess.send({
                                        pid: process.pid,
                                        topic: "error",
                                        message: err,
                                        id: message.id,
                                    });
                                }
                            }
                        }
                    }
                } else if (message.type === "boot_complete") {
                    onlineWorkerCount++;
                    if (onlineWorkerCount === 1) {
                        worker.send({
                            type: "generateManifest",
                        });
                    }
                    if (onlineWorkerCount === numCPUs) {
                        //handleLicenseValidation();
                        if (process.env.LOG_FILE_TRANSPORT && process.env.LOG_FILE_TRANSPORT === "true") {
                            handleLogArchival();
                        }
                        serverLogger.info(`UNF-Server has been initialized on PORT:${port} with ${onlineWorkerCount} Workers on ${numCPUs} cores.`, {
                            indexPrefix: "SYSTEM",
                            operation: "BOOT",
                        });
                    }
                }
            });
            // When a worker exits, fork a new one
            cluster.on("exit", (worker, code, signal) => {
                // Don't spawn new workers if we're shutting down
                if (isClusterShuttingDown) {
                    serverLogger.info(`Worker ${worker.process.pid} exited during shutdown`, {
                        indexPrefix: "SYSTEM",
                        operation: "SHUTDOWN",
                        context: { worker: { id: worker.id, pid: worker.process.pid }, code, signal },
                    });
                    return;
                }

                onlineWorkerCount--;
                serverLogger.debug(`Worker PID:${worker.process.pid} died. Instantiating another Worker.`, {
                    indexPrefix: "SYSTEM",
                    operation: "BOOT",
                    context: { worker: { id: worker.id, pid: worker.process.pid }, code, signal },
                });

                bootLoader(false, "fus")
                    .then(() => {
                        if (!isClusterShuttingDown) {  // Double check before forking
                            cluster.fork();
                        }
                    })
                    .catch(() => {
                        serverLogger.fatal("Integrity compromised, process failed, contact Wavefuel Solutions for further help.", {
                            operation: "BOOT",
                            indexPrefix: "SYSTEM",
                        });
                    });
            });
            //when a worker has an error, log it
            cluster.on("error", (error) => {
                serverLogger.fatal(`Cluster Error: ${error}`, {
                    indexPrefix: "SYSTEM",
                    operation: "BOOT",
                });
            });
        } else {
            bootLoader(false, "fus")
                .then(async () => {
                    serverLogger.trace(`UNF-Server Process is running on PORT:${port} | PID:${process.pid}.`, {
                        indexPrefix: "SYSTEM",
                        operation: "BOOT",
                    });

                    try {
                        // Start server and perform other tasks
                        const server = await startServer();
                        cluster["server"] = server;

                        if (cluster.worker && !global.isShuttingDown) {
                            try {
                                cluster.worker.send({
                                    type: "boot_complete",
                                });
                            } catch (err: any) {
                                // Ignore EPIPE errors during shutdown
                                if (err.code !== 'EPIPE') {
                                    throw err;
                                }
                            }
                        }
                    } catch (err) {
                        serverLogger.error(`Error during worker initialization: ${err}`, {
                            indexPrefix: "SYSTEM",
                            operation: "BOOT",
                        });
                    }
                })
                .catch((err) => {
                    serverLogger.fatal(`Integrity compromised, process failed, contact Wavefuel Solutions for further help. ${err}`, {
                        indexPrefix: "SYSTEM",
                        operation: "BOOT",
                    });
                });
            process.on("message", async (message: any) => {
                if (message.type === "request") {
                    let response: any = {
                        status: "failed",
                    };
                    if (message.topic === "websocket") {
                        const wsClient = global.webSocketClients.find((e: any) => {
                            return e.id.toString() === message.payload.device?.id;
                        });
                    }
                    if (process.send) {
                        process.send({
                            senderPID: process.pid,
                            type: "response",
                            message: response,
                            id: message.id,
                        });
                    }
                } else if (message.type === "generateManifest") {
                    generateManifest(cluster["server"], outputPath);
                }
            });
        }
    } else {
        bootLoader(true, "UNF")
            .then(() => {
                serverLogger.trace(`UNF-Server Process is running on PORT:${port} | PID:${process.pid}.`, {
                    operation: "BOOT",
                    indexPrefix: "SYSTEM",
                });
                // Start server and perform other tasks
                let server = startServer().then((server) => {
                    // generateManifest(server, outputPath);
                });
            })
            .catch((err) => {
                serverLogger.fatal(`Integrity compromised, process failed, contact Wavefuel Solutions for further help. ${err}`, {
                    operation: "BOOT",
                    indexPrefix: "SYSTEM",
                });
            })
            .finally(async () => {
                // initializeRedisPool()
                // 	.then(() => {
                // 	})
                // 	.catch((err) => {
                // 		serverLogger.fatal(`Error initializing Redis Pool: ${err}`, {
                // 			indexPrefix: "REDIS",
                // 			operation: "BOOT",
                // 		});
                // 		process.exit(1);
                // 	});
            });
        process.on("message", async (message: any) => {
            if (message.type === "request") {
                let response: any = {
                    status: "failed",
                };
                if (message.topic === "websocket") {
                    const wsClient = global.webSocketClients.find((e: any) => {
                        return e.id.toString() === message.payload.device?.id;
                    });
                }
                if (process.send) {
                    process.send({
                        senderPID: process.pid,
                        type: "response",
                        message: response,
                        id: message.id,
                    });
                }
            }
        });
    }
} catch (err) {
    serverLogger.fatal(`Cluster Process Exited, due to an error: ${err}`, {
        indexPrefix: "SYSTEM",
        operation: "BOOT",
    });
}

export function generateMessageId(workerId: any) {
    const timestamp = Date.now(); // Current timestamp in milliseconds
    const uuid = uuidv4(); // Generate a UUID
    return `${workerId}-${timestamp}-${uuid}`;
}

export async function sendAndAwaitForResponseFromAllProcesses(message: any) {
    if (cluster.isWorker) {
        // Wait for responses from all workers
        const responsePromises = new Promise((resolve, reject) => {
            let timeout: Record<string, any> = {
                value: undefined,
            };
            let msgId: Record<string, any> = {
                value: generateMessageId(cluster.worker!.id),
            };
            const messageHandler = (response: any) => {
                if (response.topic === "response" && response.id === msgId.value) {
                    clearTimeout(timeout.value);
                    process!.off("message", messageHandler);
                    resolve(response);
                }
            };
            timeout.value = setTimeout(() => {
                process!.off("message", messageHandler);
                reject({
                    reason: "No response was received!",
                });
            }, 65000);
            process!.on("message", messageHandler);
            cluster.worker!.send({
                senderPID: process.pid,
                topic: "websocket",
                receiverPID: null,
                type: "request",
                payload: message,
                id: msgId.value,
            });
            serverLogger.trace(`Message forwarded from Worker: ${process.pid}, to all Workers in Cluster.`, {
                indexPrefix: "SYSTEM",
                operation: "CLUSTER",
                context: { pid: process.pid },
            });
        });
        return await responsePromises;
    } else {
        throw new ServerError("Invalid worker, message tried to be sent through the master process.", ErrorCodes.INTERNAL_SERVER_ERROR);
    }
}

export async function sendAndAwaitForResponseFromSingleProcess(message: any, receiverPID: any) {
    if (cluster.isWorker) {
        // Wait for responses from all workers
        const responsePromises = new Promise((resolve, reject) => {
            let timeout: Record<string, any> = {
                value: undefined,
            };
            let msgId: Record<string, any> = {
                value: generateMessageId(cluster.worker!.id),
            };
            const messageHandler = (response: any) => {
                if (response.topic === "response" && response.id === msgId.value) {
                    clearTimeout(timeout.value);
                    process!.off("message", messageHandler);
                    resolve(response);
                }
            };
            timeout.value = setTimeout(() => {
                process!.off("message", messageHandler);
                reject({
                    reason: "No response was received!",
                });
            }, 65000);
            process!.on("message", messageHandler);
            cluster.worker!.send({
                senderPID: process.pid,
                receiverPID: receiverPID,
                topic: "websocket",
                type: "request",
                payload: message,
                id: msgId.value,
            });
            serverLogger.trace(`Message forwarded from Worker: ${process.pid}, to Workers: ${receiverPID}.`, {
                indexPrefix: "SYSTEM",
                operation: "CLUSTER",
            });
        });

        return await responsePromises;
    } else {
        throw new ServerError("Invalid worker, message tried to be sent through the master process.", ErrorCodes.INTERNAL_SERVER_ERROR);
    }
}

const gracefulShutdown = async (signal: string) => {
    serverLogger.info(`Received ${signal}, closing server...`, {
        indexPrefix: "SYSTEM",
        operation: "SHUTDOWN",
    });

    try {
        await Promise.all([
            drainRedisPool(),
            apmService.flush()
        ]);
        serverLogger.info(`Graceful shutdown completed for: ${signal}`, {
            indexPrefix: "SYSTEM",
            operation: "SHUTDOWN",
        });
    } catch (err) {
        serverLogger.error(`Error during graceful shutdown: ${err}`, {
            indexPrefix: "SYSTEM",
            operation: "ERROR",
        });
    }
};

const performGracefulShutdown = async (reason: string) => {
    serverLogger.fatal(`Initiating graceful shutdown due to: ${reason}`, {
        indexPrefix: "SYSTEM",
        operation: "SHUTDOWN",
    });
    const forceExitTimeout = setTimeout(() => {
        serverLogger.fatal(`Worker PID: ${process.pid}, forcing exit after 30s timeout`, {
            indexPrefix: "SYSTEM",
            operation: "SHUTDOWN",
        });
        process.exit(1);
    }, 30000);
    await gracefulShutdown(reason);
    clearTimeout(forceExitTimeout);
    serverLogger.fatal(`Graceful shutdown completed for: ${reason}`, {
        indexPrefix: "SYSTEM",
        operation: "SHUTDOWN",
    });
    process.exit(1);
};

process.on("unhandledRejection", async (reason: any, promise: Promise<any>) => {
    serverLogger.fatal(`Cluster Process, Unhandled Rejection at: ${reason.message} -- ${reason.stack}`, {
        indexPrefix: "SYSTEM",
        operation: "UNHANDLED_REJECTION",
        promise,
        reason,
    });
    await performGracefulShutdown("unhandledRejection");
});

process.on("uncaughtException", async (error: Error) => {
    serverLogger.fatal(`Cluster Process, Uncaught Exception: ${error.message}`, {
        indexPrefix: "SYSTEM",
        operation: "UNHANDLED_EXCEPTIONS",
        error,
    });
    await performGracefulShutdown("uncaughtException");
});

/**
 * Exit Handlers
 */
process.on("beforeExit", async (code) => {
    await performGracefulShutdown(`beforeExit with code: ${code}`);
});

process.on("exit", (code) => {
    console.log(`Process exited with code: ${code}`);
});

process.on("SIGINT", async () => {
    await performGracefulShutdown("SIGINT");
});

process.on("SIGTERM", async () => {
    await performGracefulShutdown("SIGTERM");
});

if (cluster.isPrimary) {
    const shutdownPrimary = async (signal: string) => {
        isClusterShuttingDown = true;  // Set shutdown flag

        serverLogger.info(`Primary process received ${signal}, shutting down workers...`, {
            indexPrefix: "SYSTEM",
            operation: "SHUTDOWN"
        });

        // Notify all workers to stop accepting new connections
        for (const id in cluster.workers) {
            const worker = cluster.workers[id];
            try {
                worker?.send({ type: 'shutdown' });
            } catch (err: any) {
                // Ignore EPIPE errors during shutdown
                if (err.code !== 'EPIPE') {
                    serverLogger.error(`Error sending shutdown to worker ${id}:`, {
                        indexPrefix: "SYSTEM",
                        operation: "SHUTDOWN",
                        error: err
                    });
                }
            }
        }

        // Wait for workers to exit gracefully
        await new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
                serverLogger.warn('Force killing workers after timeout', {
                    indexPrefix: "SYSTEM",
                    operation: "SHUTDOWN"
                });
                for (const id in cluster.workers) {
                    cluster.workers[id]?.kill('SIGKILL');
                }
                resolve();
            }, 31000); // Slightly longer than worker timeout

            cluster.on('exit', (worker, code, signal) => {
                if (Object.keys(cluster.workers || {}).length === 0) {
                    clearTimeout(timeout);
                    resolve();
                }
            });
        });

        // Perform primary process cleanup
        await Promise.all([
            drainRedisPool(),
            apmService.flush()
        ]);

        process.exit(0);
    };

    process.on('SIGTERM', () => shutdownPrimary('SIGTERM'));
    process.on('SIGINT', () => shutdownPrimary('SIGINT'));
}
