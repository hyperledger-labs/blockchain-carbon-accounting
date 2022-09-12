import { ErrInvalidDateFormat, ErrUnknownUOM } from './const';

export const UOM_FACTORS: { [key: string]: number } = {
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

export const getUomFactor = (uom?: string): number => {
    if (!uom) {
        throw new Error(`${ErrUnknownUOM} : undefined uom`);
    }
    const factor = UOM_FACTORS[uom.toLowerCase()];
    if (!factor) {
        throw new Error(`${ErrUnknownUOM} : ${uom} is not a valid uom`);
    }
    return factor;
};

export const getYearFromDate = (date: string): number => {
    const time = new Date(date);
    if (!time.getFullYear()) {
        throw new Error(`${ErrInvalidDateFormat} : ${date} date format not supported`);
    }
    return time.getFullYear();
};

export interface CO2EmissionFactorInterface {
    emission: {
        value: number;
        uom: string;
    };
    division_type?: string;
    division_id?: string;
    renewable_energy_use_amount?: number;
    nonrenewable_energy_use_amount?: number;
    year: number;
}
