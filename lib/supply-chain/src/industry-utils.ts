import type { EmissionsFactorInterface } from "@blockchain-carbon-accounting/emissions_data_lib";

import {
  Activity,
  ActivityResult,
  Emissions,
  IndustryActivity,
} from "./common-types";

import { getEmissionFactor} from './emissions-utils'
import { weight_in_kg, volume_to_cubic_meters} from './unit-utils'

export async function process_industry(
  _a: IndustryActivity
): Promise<ActivityResult> {
  const amount = _a.activity_amount
  const uom = _a.activity_uom
  const emissions_type = _a.emissions_type
  const emissions_name = _a.emissions_name
  const emissions: Emissions={
    amount: {
      value: 0,
      unit: "kgCO2e",
    },
    scope: '1' //assume calculating industry scope 1 unless 
  }
  try{
    // first check if already reported in co2e units
    emissions.amount.value = kg_from_co2e(uom,amount)!
  }catch(error){
    console.log(error)
    switch(emissions_type){
      case 'flaring':
        try{
          const result = await flaring_in_kg_co2e(amount,uom)
          emissions.amount.value = result.amount
          emissions.factor = result.factor!
          emissions.scope = emissions?.factor?.scope
        }catch(error){
          throw new Error(`Error converting methane flaring amount to kg co2e: ${error}`)
        }
        break
      case 'venting': case 'leakage':
        if(!_a.gwp || _a.gwp===1){
          _a.gwp = 28 // enforce IPCC 100 GWP for methane
        }
        emissions.amount.value = methane_in_kg_co2e(_a.gwp,amount,uom,)
        break
      case 'combustion':
        throw new Error(`Conversion of industry emissons from combustion to kg CO2e calculation  not yet supported`)
        break
      default:
    }
  }
  const results: {
    emissions: Emissions,
  } = { emissions };

  return results;
}

function kg_from_co2e(uom:string,amount:number){
  const u = uom.toLowerCase();
  const ico2e = u.indexOf('co2e')
  console.log(ico2e)
  if(ico2e){
    const unit = u.slice(0, ico2e).trim()
    console.log(unit)
    return weight_in_kg(amount,unit)
  }
  throw new Error(`CO2e unit not detected`)
}
export async function flaring_in_kg_co2e(amount?: number, uom?: string) {
  if (!amount) throw new Error(`Invalid flaring amount`);
  if (!uom) throw new Error(`No unit provided`);
  const data = {level_1: 'FUELS', level_2: 'GASEOUS FUELS', level_3: 'NATURAL GAS', text: 'Volume', activity_uom: 'cubic metres'} as Partial<EmissionsFactorInterface>;
  // get natural gas emissions factor in kg CO2e per cubic meter
  const factor = await getEmissionFactor(data);
  console.log(factor)
  amount *= Number(factor?.co2_equivalent_emissions);
  const u = uom.toLowerCase();
  amount = volume_to_cubic_meters(amount,u);
  return {amount,factor}
}
export function methane_in_kg_co2e(gwp: number, amount?: number, uom?: string) {
  if (!amount) throw new Error(`Invalid methane emissions amount`);
  if (!uom) throw new Error(`No unit provided`);
  // check supported UOMs
  const u = uom.toLowerCase();
  amount *= gwp;
  const factor = 0.671 // kgCO2e / cubic meter;
  amount *= factor
  return volume_to_cubic_meters(amount,u);
  let result
}