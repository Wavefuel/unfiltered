import { ErrorCodes, ServerError, handleError } from "@/core/utils/errors/errorHandler";
import { FastifyRequest, FastifyReply, FastifyError } from "fastify";

// Error-Handling Middleware
export const errorHandlerMiddleware = (err: any, req: FastifyRequest, res: FastifyReply) => {
	//Enforce Error Type is of Server Error
	if (err instanceof ServerError) err = err;
	else {
		if (err instanceof Error) {
			err = new ServerError(err.message, ErrorCodes.INTERNAL_SERVER_ERROR, { name: err.name }, err);
		} else if (typeof err === "string") {
			err = new ServerError(err, ErrorCodes.INTERNAL_SERVER_ERROR);
		} else {
			err = new ServerError("An Unknown Error Occurred", ErrorCodes.UNKNOWN_ERROR);
		}
	}
	if (err instanceof ServerError) {
		handleError({ err, shouldLog: true, shouldThrow: false, isFatal: err.statusCode >= 500 ? true : false });
		res.status(err.statusCode || 500).json({
			data: null,
			message: err.message,
			error: {
				status: err.statusCode || 500,
				code: err.code,
				metadata: JSON.stringify(err.metadata),
				stack:
					(err.code === ErrorCodes.UNKNOWN_ERROR || err.code === ErrorCodes.INTERNAL_SERVER_ERROR) && process.env.NODE_ENV === "development"
						? err.stack
						: undefined,
			},
		});
	}
};
