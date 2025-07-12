export class TimeoutError extends Error {
    constructor(message, duration) {
        super(message);
        this.duration = duration;
        this.name = 'TimeoutError';
    }
}
//# sourceMappingURL=types.js.map