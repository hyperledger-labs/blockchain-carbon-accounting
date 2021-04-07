/*
    SPDX-License-Identifier: Apache-2.0
*/

import { ErrInvalidDateFormat, ErrUnknownUOM } from '../util/const';

//
const UOM_FACTORS: { [key: string]: number } = {
  wh: 1.0,
  kwh: 1000.0,
  mwh: 1000000.0,
  gwh: 1000000000.0,
  twh: 1000000000000.0,
  kg: 1.0,
  t: 1000.0,
  ton: 1000.0,
  tons: 1000.0,
  g: 0.001,
  kt: 1000000.0,
  mt: 1000000000.0,
  pg: 1000000000.0,
  gt: 1000000000000.0,
};

export const getUomFactor = (uom: string): number => {
  const factor = UOM_FACTORS[uom.toLowerCase()];
  if (!factor) {
    throw new Error(`${ErrUnknownUOM} : ${uom} is not a valid uom`);
  }
  return factor;
};

export const getYearFromDate = (date: string): number => {
  // pattern1 : YYYY-[mm/dd]-[mm/dd]
  const pattern1 = /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/;
  // pattern2 : [mm/dd]-[mm/dd]-YYYY
  const pattern2 = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/;
  if (pattern1.test(date)) {
    return Number(date.substring(0, 4));
  } else if (pattern2.test(date)) {
    return Number(date.substring(date.length - 4));
  }
  throw new Error(
    `${ErrInvalidDateFormat} : ${date} date format not supported`
  );
};
