import { Logger } from './types.js';
export declare class DefaultLogger implements Logger {
    private isEnabled;
    constructor(enabled?: boolean);
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    enable(): void;
    disable(): void;
}
export declare const createSilentLogger: () => Logger;
//# sourceMappingURL=logger.d.ts.map