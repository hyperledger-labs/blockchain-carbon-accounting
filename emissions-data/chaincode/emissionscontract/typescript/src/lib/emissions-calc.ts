/*
    SPDX-License-Identifier: Apache-2.0
*/

import type { EmissionsFactorInterface } from '@blockchain-carbon-accounting/emissions_data_lib/src/emissionsFactor';
import type { CO2EmissionFactorInterface } from '@blockchain-carbon-accounting/emissions_data_lib/src/emissions-calc';
import { getUomFactor } from '@blockchain-carbon-accounting/emissions_data_lib/src/emissions-calc';

//

export const getCO2EmissionFactor = (
    factor: EmissionsFactorInterface,
    usage: number,
    usageUOM: string,
): CO2EmissionFactorInterface => {
    // initialize return variables
    let emissionsValue: number;
    let emissionsUOM: string;
    let renewableEnergyUseAmount: number;
    let nonrenewableEnergyUseAmount: number;

    // calculate emissions using percent_of_renewables if found
    if (factor.percent_of_renewables?.length !== 0) {
        emissionsUOM = 'g';
        const co2EquivalentEmissionsUOM = factor.co2_equivalent_emissions_uom?.split('/');
        if (!co2EquivalentEmissionsUOM) {
            throw new Error('co2_equivalent_emissions_uom not found in factor');
        }
        emissionsValue =
            (Number(factor.co2_equivalent_emissions) *
                usage *
                getUomFactor(co2EquivalentEmissionsUOM[0])) /
            getUomFactor(co2EquivalentEmissionsUOM[1]);
        const percentOfRenewables = Number(factor.percent_of_renewables) / 100;
        renewableEnergyUseAmount = usage * percentOfRenewables;
        nonrenewableEnergyUseAmount = usage * (1 - percentOfRenewables);
    } else {
        emissionsUOM = 'tons';

        const net_generation_uom = factor.net_generation_uom;
        const co2_equivalent_emissions_uom = factor.co2_equivalent_emissions_uom;

        const usageUOMConversion = getUomFactor(usageUOM) / getUomFactor(net_generation_uom);
        const emissionsUOMConversion =
            getUomFactor(co2_equivalent_emissions_uom) / getUomFactor(emissionsUOM);

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
    } as CO2EmissionFactorInterface;
};
