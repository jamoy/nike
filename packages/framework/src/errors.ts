export function Error(code: string, message: string) {
    return new Error(`[${code}] ${message}`);
}
