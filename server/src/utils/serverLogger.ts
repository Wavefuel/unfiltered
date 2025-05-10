import path from "path";

// Define log levels and their severities
const LOG_LEVELS = {
	fatal: { severity: 0, color: "\x1b[31m" }, // Red
	error: { severity: 1, color: "\x1b[31m" }, // Red
	warn: { severity: 2, color: "\x1b[33m" }, // Yellow
	info: { severity: 3, color: "\x1b[32m" }, // Green
	debug: { severity: 4, color: "\x1b[36m" }, // Cyan
	trace: { severity: 5, color: "\x1b[35m" }, // Magenta
};

// Reset color code
const RESET_COLOR = "\x1b[0m";

// Logger options interface
interface LoggerOptions {
	consoleLevel: string;
	isStack?: boolean;
	rotate?: boolean;
	levels?: typeof LOG_LEVELS;
}

// Metadata options interface
export interface MetadataOptions {
	operation?: string;
	context?: any;
	[key: string]: any;
}

// Default logger options
const defaultOptions: LoggerOptions = {
	consoleLevel: "info",
	isStack: false,
	rotate: false,
	levels: LOG_LEVELS,
};

// Get process ID
const processId = process.pid;

// Format timestamp
function formatTimestamp(): string {
	return new Date().toISOString();
}

// Format log message
function formatLogMessage(level: string, args: any, meta?: MetadataOptions): string {
	const timestamp = formatTimestamp();
	const levelLower = level.toLowerCase();
	const color = LOG_LEVELS[level as keyof typeof LOG_LEVELS]?.color || "";

	// Format the message with colored type and timestamp
	let message = `${color}[${levelLower}] ~: ${timestamp}${RESET_COLOR}: ${processId}:: `;

	// Add the actual message
	if (typeof args === "string") {
		message += args;
	} else if (args instanceof Error) {
		message += args.message;
		if (args.stack && defaultOptions.isStack) {
			message += `\n${args.stack}`;
		}
	} else {
		message += JSON.stringify(args);
	}

	// Add context if provided (without operation tags)
	if (meta?.context) {
		message += ` [Context: ${JSON.stringify(meta.context)}]`;
	}

	return message;
}

// Create logger instance
function createLogger(options: LoggerOptions = defaultOptions) {
	const logger: Record<string, (args: any, meta?: MetadataOptions) => void> = {};

	// Create log functions for each level
	Object.keys(LOG_LEVELS).forEach((level) => {
		logger[level] = (args: any, meta?: MetadataOptions) => {
			const message = formatLogMessage(level, args, meta);

			// Use appropriate console method based on level
			switch (level) {
				case "fatal":
				case "error":
					console.error(message);
					break;
				case "warn":
					console.warn(message);
					break;
				case "info":
					console.info(message);
					break;
				case "debug":
					console.debug(message);
					break;
				case "trace":
					console.trace(message);
					break;
				default:
					console.log(message);
			}
		};
	});

	return logger;
}

// Export the logger
export const serverLogger = createLogger();
