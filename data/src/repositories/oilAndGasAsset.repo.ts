import { OilAndGasAssetDbInterface } from "@blockchain-carbon-accounting/data-common/db";
import type { OilAndGasAssetInterface } from "@blockchain-carbon-accounting/oil-and-gas-data-lib/src/oilAndGasAsset";
//import { OIL_AND_GAS_ASSET_CLASS_IDENTIFIER } from "@blockchain-carbon-accounting/oil-and-gas-data-lib/src/oilAndGasAsset";
import { DataSource, SelectQueryBuilder } from "typeorm"

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
    const repo = this._db.getRepository(OilAndGasAsset)
    await repo.save(doc)
  }

  public getAsset = async (uuid: string): Promise<OilAndGasAssetInterface | null> => {
    return await this._db.getRepository(OilAndGasAsset).findOneBy({uuid})
  }

  public selectPaginated = async (offset: number, limit: number, bundles: Array<QueryBundle>): Promise<Array<OilAndGasAsset>> => {
    let selectBuilder: SelectQueryBuilder<OilAndGasAsset> = this._db.getRepository(OilAndGasAsset).createQueryBuilder("oil_and_gas_asset")
    // category by issuer address
    selectBuilder = buildQueries('oil_and_gas_asset', selectBuilder, bundles)
    return selectBuilder
      .limit(limit)
      .offset(offset)
      .orderBy('oil_and_gas_asset.operator', 'ASC')
      .getMany();
  }

  public selectOperatorsPaginated = async (offset: number, limit: number, bundles: Array<QueryBundle>): Promise<Array<Operator>> => {
    let selectBuilder: SelectQueryBuilder<OilAndGasAsset> = this._db.getRepository(OilAndGasAsset).createQueryBuilder("oil_and_gas_asset")
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
    return await this._db.getRepository(OilAndGasAsset).find()
  }

  public countAssets = async (bundles: Array<QueryBundle>): Promise<number> => {
    let selectBuilder: SelectQueryBuilder<OilAndGasAsset> = this._db.getRepository(OilAndGasAsset).createQueryBuilder("oil_and_gas_asset")
    selectBuilder = buildQueries('oil_and_gas_asset', selectBuilder, bundles)
    return selectBuilder
      .select('oil_and_gas_asset')
      .getCount()
    //return await this._db.getRepository(OilAndGasAsset).count()
  }

  public countOperators = async (bundles: Array<QueryBundle>): Promise<number> => {
    let selectBuilder: SelectQueryBuilder<OilAndGasAsset> = this._db.getRepository(OilAndGasAsset).createQueryBuilder("oil_and_gas_asset")
    // category by issuer address
    selectBuilder = buildQueries('oil_and_gas_asset', selectBuilder, bundles)
    return selectBuilder
      .select('oil_and_gas_asset.operator')
      .distinct(true)
      .getCount()
  }

}
