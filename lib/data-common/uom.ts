import { ErrUnknownUOM } from "@blockchain-carbon-accounting/emissions_data_lib";

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
  tonnes: 1000,
  g: 0.001,
  kt: 1000000.0,
  mt: 1000000000.0,
  pg: 1000000000.0,
  gt: 1000000000000.0,
  "Room per night": 1,
  "passenger.km": 1,
  "tonne.km": 1,
};

export const getUomFactor = (uom: string): number => {
  const factor = UOM_FACTORS[uom.toLowerCase()];
  if (!factor) {
    throw new Error(`${ErrUnknownUOM} : ${uom} is not a valid uom`);
  }
  return factor;
};

