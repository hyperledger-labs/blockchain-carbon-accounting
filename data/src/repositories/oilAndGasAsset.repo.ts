import { OilAndGasAssetDbInterface } from "@blockchain-carbon-accounting/data-common/db";
import type { OilAndGasAssetInterface } from "@blockchain-carbon-accounting/oil-and-gas-data-lib/src/oilAndGasAsset";
//import { OIL_AND_GAS_ASSET_CLASS_IDENTIFIER } from "@blockchain-carbon-accounting/oil-and-gas-data-lib/src/oilAndGasAsset";
import { Between, DataSource, SelectQueryBuilder, FindOptionsWhere, ILike, LessThanOrEqual, MoreThanOrEqual } from "typeorm"

import { OilAndGasAsset } from "../models/oilAndGasAsset"
import type { Operator } from "../models/oilAndGasAsset"
import { buildQueries, QueryBundle } from "./common"

export class OilAndGasAssetRepo implements OilAndGasAssetDbInterface {

  private _db: DataSource

  constructor(dbConnection: DataSource) {
    this._db = dbConnection
  }

  public putAsset = async (doc: OilAndGasAssetInterface) => {
    // cleanup any existing record matching the scope/l1/../l4/text/activity_uom and year
    const repo = await this._db.getRepository(OilAndGasAsset)
    if(! await repo.findOneBy(this.makeAssetMatchCondition(doc))){
      await this._db.getRepository(OilAndGasAsset).save(doc)
    }
  }

  public getAsset = async (uuid: string): Promise<OilAndGasAssetInterface | null> => {
    return await this._db.getRepository(OilAndGasAsset).findOneBy({uuid})
  }

  public selectPaginated = async (offset: number, limit: number, bundles: Array<QueryBundle>): Promise<Array<OilAndGasAsset>> => {
    let selectBuilder: SelectQueryBuilder<OilAndGasAsset> = await this._db.getRepository(OilAndGasAsset).createQueryBuilder("oil_and_gas_asset")
    // category by issuer address
    selectBuilder = buildQueries('oil_and_gas_asset', selectBuilder, bundles)
    return selectBuilder
      .limit(limit)
      .offset(offset)
      .orderBy('oil_and_gas_asset.operator', 'ASC')
      .getMany();
  }

  public selectOperatorsPaginated = async (offset: number, limit: number, bundles: Array<QueryBundle>): Promise<Array<Operator>> => {
    let selectBuilder: SelectQueryBuilder<OilAndGasAsset> = await this._db.getRepository(OilAndGasAsset).createQueryBuilder("oil_and_gas_asset")
    // category by issuer address
    selectBuilder = buildQueries('oil_and_gas_asset', selectBuilder, bundles)
    return selectBuilder
      .select('oil_and_gas_asset.operator')
      .distinct(true)
      .limit(limit)
      .offset(offset)
      .orderBy('oil_and_gas_asset.operator', 'ASC')
      .getRawMany();
  }

  public getAssets = async (): Promise<OilAndGasAssetInterface[]> => {
    return await this._db.getRepository(OilAndGasAsset).find();
  }

  public countAssets = async (bundles: Array<QueryBundle>): Promise<number> => {
    let selectBuilder: SelectQueryBuilder<OilAndGasAsset> = await this._db.getRepository(OilAndGasAsset).createQueryBuilder("oil_and_gas_asset")
    selectBuilder = buildQueries('oil_and_gas_asset', selectBuilder, bundles)
    return selectBuilder
      .select('oil_and_gas_asset')
      .getCount()
    //return await this._db.getRepository(OilAndGasAsset).count()
  }

  public countOperators = async (bundles: Array<QueryBundle>): Promise<number> => {
    let selectBuilder: SelectQueryBuilder<OilAndGasAsset> = await this._db.getRepository(OilAndGasAsset).createQueryBuilder("oil_and_gas_asset")
    // category by issuer address
    selectBuilder = buildQueries('oil_and_gas_asset', selectBuilder, bundles)
    return selectBuilder
      .select('oil_and_gas_asset.operator')
      .distinct(true)
      .getCount()
  }

  private makeAssetMatchCondition = (doc: Partial<OilAndGasAssetInterface>) => {
    // creates an array of case insensitive queries
    const conditions: FindOptionsWhere<OilAndGasAsset> = {}
    if (doc.type) conditions.type = ILike(doc.type)
    if (doc.name) conditions.name = ILike(doc.name)
    if (doc.country) conditions.country = ILike(doc.country)
    if (doc.division_type) conditions.division_type = ILike(doc.division_type)
    if (doc.division_name) conditions.division_name = ILike(doc.division_name)
    if (doc.sub_division_type) conditions.sub_division_type = ILike(doc.sub_division_type)
    if (doc.sub_division_name) conditions.sub_division_name = ILike(doc.sub_division_name)
    if (doc.status) conditions.status = ILike(doc.status)
    if (doc.api) conditions.api = ILike(doc.api)
    if (doc.description) conditions.description = ILike(doc.description)
    if (doc.operator) conditions.operator = ILike(doc.operator)
    if (doc.latitude) conditions.latitude = ILike(doc.latitude)
    if (doc.longitude) conditions.longitude = ILike(doc.longitude)
    if (doc.source) conditions.source = ILike(doc.source)
    //if (doc.source_date) conditions.source_date = ILike(doc.source_date)
    if (doc.validation_method) conditions.validation_method = ILike(doc.validation_method)
    //if (doc.validation_date) conditions.validation_date = ILike(doc.validation_date)
    if (doc.product) conditions.product = ILike(doc.product)
    if (doc.field) conditions.field = ILike(doc.field)
    if (doc.depth) conditions.depth = ILike(doc.depth)
    return conditions
  }

}
