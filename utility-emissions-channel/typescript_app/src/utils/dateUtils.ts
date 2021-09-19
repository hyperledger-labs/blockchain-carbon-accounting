// SPDX-License-Identifier: Apache-2.0
export function checkDateConflict(
    a_start: string,
    a_end: string,
    b_start: string,
    b_end: string,
): boolean {
    if (a_start <= b_start && b_start <= a_end) {
        return true;
    } // b starts in a
    if (a_start <= b_end && b_end <= a_end) {
        return true;
    } // b ends in a
    if (b_start < a_start && a_end < b_end) {
        return true;
    } // a in b
    return false;
}

export function toTimestamp(strDate: string): number {
    const datum = Date.parse(strDate);
    return datum / 1000;
}
