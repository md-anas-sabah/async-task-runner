export class DefaultLogger {
    constructor(enabled = true) {
        this.isEnabled = enabled;
    }
    info(message, ...args) {
        if (this.isEnabled) {
            console.log(`[INFO] ${message}`, ...args);
        }
    }
    warn(message, ...args) {
        if (this.isEnabled) {
            console.warn(`[WARN] ${message}`, ...args);
        }
    }
    error(message, ...args) {
        if (this.isEnabled) {
            console.error(`[ERROR] ${message}`, ...args);
        }
    }
    enable() {
        this.isEnabled = true;
    }
    disable() {
        this.isEnabled = false;
    }
}
export const createSilentLogger = () => ({
    info: () => { },
    warn: () => { },
    error: () => { },
});
//# sourceMappingURL=logger.js.map