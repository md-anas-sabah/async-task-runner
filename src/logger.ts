import { Logger } from './types.js';

export class DefaultLogger implements Logger {
  private isEnabled: boolean;

  constructor(enabled = true) {
    this.isEnabled = enabled;
  }

  info(message: string, ...args: any[]): void {
    if (this.isEnabled) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.isEnabled) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.isEnabled) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }
}

export const createSilentLogger = (): Logger => ({
  info: () => {},
  warn: () => {},
  error: () => {},
});