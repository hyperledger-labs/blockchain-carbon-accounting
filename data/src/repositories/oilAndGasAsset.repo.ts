import { OilAndGasAssetDbInterface } from "@blockchain-carbon-accounting/data-common/db";
import type { OilAndGasAssetInterface } from "@blockchain-carbon-accounting/oil-and-gas-data-lib/src/oilAndGasAsset";
import { OIL_AND_GAS_ASSET_CLASS_IDENTIFER } from "@blockchain-carbon-accounting/oil-and-gas-data-lib/src/oilAndGasAsset";
import { Between, DataSource, FindOptionsWhere, ILike, LessThanOrEqual, MoreThanOrEqual, SelectQueryBuilder } from "typeorm"
import { OilAndGasAsset } from "../models/oilAndGasAsset"
import { UtilityLookupItem } from "../models/utilityLookupItem"

export class OilAndGasAssetRepo implements OilAndGasAssetDbInterface {

  private _db: DataSource

  constructor(dbConnection: DataSource) {
    this._db = dbConnection
  }

  private addYearConditionsToQueryBuilder = (
      {from_year, thru_year}:{from_year?: string, thru_year?: string},
      queryBuilder: SelectQueryBuilder<OilAndGasAsset> | SelectQueryBuilder<UtilityLookupItem>
  ) => {
    if (from_year && thru_year) {
      queryBuilder.andWhere("year BETWEEN :from_year AND :thru_year", {from_year, thru_year})
    } else if (from_year) {
      queryBuilder.andWhere("year >= :from_year", {from_year})
    } else if (thru_year) {
      queryBuilder.andWhere("year <= :thru_year", {thru_year})
    }
    return queryBuilder
  }

  public putAsset = async (doc: OilAndGasAssetInterface) => {
    // cleanup any existing record matching the scope/l1/../l4/text/activity_uom and year
    const repo = this._db.getRepository(OilAndGasAsset)
    await repo.save(doc)
  }

/*  public getAsset = async (uuid: string): Promise<OilAndGasAssetInterface | null> => {
    return await this._db.getRepository(OilAndGasAsset).findOneBy({uuid})
  }*/


  public getAllAssets = async (): Promise<OilAndGasAssetInterface[]> => {
    return await this._db.getRepository(OilAndGasAsset).find()
  }

  public countAllAssets = async (): Promise<number> => {
    return await this._db.getRepository(OilAndGasAsset).count()
  }

}
