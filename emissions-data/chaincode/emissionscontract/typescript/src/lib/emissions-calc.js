"use strict";
/*
    SPDX-License-Identifier: Apache-2.0
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCO2EmissionFactor = exports.getYearFromDate = exports.getUomFactor = void 0;
const const_1 = require("../util/const");
//
const UOM_FACTORS = {
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
const getUomFactor = (uom) => {
    const factor = UOM_FACTORS[uom.toLowerCase()];
    if (!factor) {
        throw new Error(`${const_1.ErrUnknownUOM} : ${uom} is not a valid uom`);
    }
    return factor;
};
exports.getUomFactor = getUomFactor;
const getYearFromDate = (date) => {
    const time = new Date(date);
    if (!time.getFullYear()) {
        throw new Error(`${const_1.ErrInvalidDateFormat} : ${date} date format not supported`);
    }
    return time.getFullYear();
};
exports.getYearFromDate = getYearFromDate;
const getCO2EmissionFactor = (factor, usage, usageUOM) => {
    // initialize return variables
    let emissionsValue;
    let emissionsUOM;
    let renewableEnergyUseAmount;
    let nonrenewableEnergyUseAmount;
    // calculate emissions using percent_of_renewables if found
    if (factor.percent_of_renewables.length !== 0) {
        emissionsUOM = 'g';
        const co2EquivalentEmissionsUOM = factor.co2_equivalent_emissions_uom.split('/');
        if (co2EquivalentEmissionsUOM.length === 0) {
            console.error('co2_equivalent_emissions_uom not found in factor');
        }
        emissionsValue =
            (Number(factor.co2_equivalent_emissions) *
                usage *
                (0, exports.getUomFactor)(co2EquivalentEmissionsUOM[0])) /
                (0, exports.getUomFactor)(co2EquivalentEmissionsUOM[1]);
        const percentOfRenewables = Number(factor.percent_of_renewables) / 100;
        renewableEnergyUseAmount = usage * percentOfRenewables;
        nonrenewableEnergyUseAmount = usage * (1 - percentOfRenewables);
    }
    else {
        emissionsUOM = 'tons';
        const net_generation_uom = factor.net_generation_uom;
        const co2_equivalent_emissions_uom = factor.co2_equivalent_emissions_uom;
        const usageUOMConversion = (0, exports.getUomFactor)(usageUOM) / (0, exports.getUomFactor)(net_generation_uom);
        const emissionsUOMConversion = (0, exports.getUomFactor)(co2_equivalent_emissions_uom) / (0, exports.getUomFactor)(emissionsUOM);
        emissionsValue =
            (Number(factor.co2_equivalent_emissions) / Number(factor.net_generation)) *
                usage *
                usageUOMConversion *
                emissionsUOMConversion;
        const totalGeneration = Number(factor.non_renewables) + Number(factor.renewables);
        renewableEnergyUseAmount = usage * (Number(factor.renewables) / totalGeneration);
        nonrenewableEnergyUseAmount = usage * (Number(factor.non_renewables) / totalGeneration);
    }
    return {
        emission: {
            value: emissionsValue,
            uom: emissionsUOM,
        },
        division_type: factor.division_type,
        division_id: factor.division_id,
        renewable_energy_use_amount: renewableEnergyUseAmount,
        nonrenewable_energy_use_amount: nonrenewableEnergyUseAmount,
        year: Number(factor.year),
    };
};
exports.getCO2EmissionFactor = getCO2EmissionFactor;
