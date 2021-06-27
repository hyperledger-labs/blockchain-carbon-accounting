// SPDX-License-Identifier: Apache-2.0
export function checkDateConflict(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
) {
  if (aStart <= bStart && bStart <= aEnd) {
    return true;
  } // b starts in a
  if (aStart <= bEnd && bEnd <= aEnd) {
    return true;
  } // b ends in a
  if (bStart < aStart && aEnd < bEnd) {
    return true;
  } // a in b
  return false;
}

export function toTimestamp(strDate) {
  const datum = Date.parse(strDate);
  return datum / 1000;
}
