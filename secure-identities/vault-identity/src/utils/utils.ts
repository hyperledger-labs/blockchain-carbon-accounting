export function nonBlankString(candidate: string, name: string): void {
    if (candidate.trim().length === 0) {
        throw new Error(`Require non-empty ${name}`);
    }
}
