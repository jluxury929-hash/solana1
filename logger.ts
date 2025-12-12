// src/logger.ts

/**
 * Defines the logging interface used throughout the bot, ensuring
 * consistency and type safety for all logging levels, including 'fatal'.
 */
export interface Logger {
    info: (message: string, ...optionalParams: any[]) => void;
    warn: (message: string, ...optionalParams: any[]) => void;
    error: (message: string, ...optionalParams: any[]) => void;
    fatal: (message: string, ...optionalParams: any[]) => void;
}

export const logger: Logger = {
    info: (msg, ...p) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`, ...p),
    warn: (msg, ...p) => console.warn(`[WARN] ${new Date().toISOString()} ${msg}`, ...p),
    error: (msg, ...p) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`, ...p),
    // Implementing 'fatal' to log and immediately terminate the process
    fatal: (msg, ...p) => { 
        console.error(`[FATAL] ${new Date().toISOString()} ${msg}`, ...p);
        process.exit(1); 
    },
};
