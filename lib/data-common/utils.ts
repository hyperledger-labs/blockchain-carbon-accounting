import { SingleBar } from "cli-progress";


export const EMISSIONS_FACTOR_TYPE = "EMISSIONS_ELECTRICITY";

export interface ActivityInterface {
  scope: string;
  level_1: string;
  level_2: string;
  level_3: string;
  level_4?: string;
  text?: string;
  activity_uom: string;
  activity: number;
  passengers?: number;
  tonnesShipped?: number;
}

export const getYearFromDate = (date: string): number => {
  const time = new Date(date);
  if (!time.getFullYear()) {
    throw new Error(`${date} date format not supported`);
  }
  return time.getFullYear();
};