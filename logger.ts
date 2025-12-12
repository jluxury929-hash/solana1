// src/logger.ts

export interface Logger {
    info: (message: string, ...optionalParams: any[]) => void;
    warn: (message: string, ...optionalParams: any[]) => void;
    error: (message: string, ...optionalParams: any[]) => void;
    fatal: (message: string, ...optionalParams: any[]) => void;
    debug: (message: string, ...optionalParams: any[]) => void; // <--- ADDED
}

export const logger: Logger = {
    info: (msg, ...p) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`, ...p),
    warn: (msg, ...p) => console.warn(`[WARN] ${new Date().toISOString()} ${msg}`, ...p),
    error: (msg, ...p) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`, ...p),
    fatal: (msg, ...p) => { 
        console.error(`[FATAL] ${new Date().toISOString()} ${msg}`, ...p);
        process.exit(1); 
    },
    debug: (msg, ...p) => console.debug(`[DEBUG] ${new Date().toISOString()} ${msg}`, ...p), // <--- ADDED
};
