import { Sequelize, Model, DataTypes } from 'sequelize'
import { EmissionsFactorInterface } from '../../../emissions-data/chaincode/emissionscontract/typescript/src/lib/emissionsFactor'
import { UtilityLookupItemInterface } from '../../../emissions-data/chaincode/emissionscontract/typescript/src/lib/utilityLookupItem'
import { DbOpts } from './config'

export class EmissionsFactorModel extends Model implements EmissionsFactorInterface {
  uuid: string
  class: string
  key?: string
  type: string
  scope: string
  level_1: string
  level_2: string
  level_3: string
  level_4?: string
  text?: string
  year?: string
  country?: string
  division_type?: string
  division_id?: string
  division_name?: string
  activity_uom?: string
  net_generation?: string
  net_generation_uom?: string
  co2_equivalent_emissions?: string
  co2_equivalent_emissions_uom?: string
  source?: string
  non_renewables?: string
  renewables?: string
  percent_of_renewables?: string
}

export class UtilityLookupItemModel extends Model implements UtilityLookupItemInterface {
  uuid: string;
  class: string;
  key?: string;
  year?: string;
  utility_number?: string;
  utility_name?: string;
  country?: string;
  state_province?: string;
  division_type?: string;
  division_id?: string; 
}

export const initModels = async (connection: Sequelize, opts?: DbOpts) => {

  EmissionsFactorModel.init({
    uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, primaryKey: true, }, 
    class: { type: DataTypes.STRING, allowNull: false },
    key: { type: DataTypes.STRING }, 
    type: { type: DataTypes.STRING, allowNull: false }, 
    scope: { type: DataTypes.STRING, allowNull: false }, 
    level_1: { type: DataTypes.STRING, allowNull: false }, 
    level_2: { type: DataTypes.STRING, allowNull: false }, 
    level_3: { type: DataTypes.STRING, allowNull: false }, 
    level_4: { type: DataTypes.STRING }, 
    text: { type: DataTypes.STRING }, 
    year: { type: DataTypes.STRING }, 
    country: { type: DataTypes.STRING }, 
    division_type: { type: DataTypes.STRING }, 
    division_id: { type: DataTypes.STRING }, 
    division_name: { type: DataTypes.STRING }, 
    activity_uom: { type: DataTypes.STRING }, 
    net_generation: { type: DataTypes.STRING }, 
    net_generation_uom: { type: DataTypes.STRING }, 
    co2_equivalent_emissions: { type: DataTypes.STRING }, 
    co2_equivalent_emissions_uom: { type: DataTypes.STRING }, 
    source: { type: DataTypes.STRING }, 
    non_renewables: { type: DataTypes.STRING }, 
    renewables: { type: DataTypes.STRING }, 
    percent_of_renewables: { type: DataTypes.STRING }, 
  }, {
      sequelize: connection,
      timestamps: false,
    })

  UtilityLookupItemModel.init({
    uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, primaryKey: true, }, 
    class: { type: DataTypes.STRING, allowNull: false },
    key: { type: DataTypes.STRING }, 
    year: { type: DataTypes.STRING }, 
    utility_number: { type: DataTypes.STRING }, 
    utility_name: { type: DataTypes.STRING }, 
    country: { type: DataTypes.STRING }, 
    state_province: { type: DataTypes.STRING }, 
    division_type: { type: DataTypes.STRING }, 
    division_id: { type: DataTypes.STRING }, 
  }, {
      sequelize: connection,
      timestamps: false,
    })

  // sync will create the tables as needed
  if (opts?.dbClear) {
    console.log('Clearing DB and recreating tables...')
  }
  await EmissionsFactorModel.sync({alter: true, force: opts?.dbClear})
  await UtilityLookupItemModel.sync({alter: true, force: opts?.dbClear})
}

