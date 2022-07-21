import { OilAndGasAssetDbInterface } from "@blockchain-carbon-accounting/data-common/db";
import type { OilAndGasAssetInterface } from "@blockchain-carbon-accounting/oil-and-gas-data-lib/src/oilAndGasAsset";
//import { OIL_AND_GAS_ASSET_CLASS_IDENTIFER } from "@blockchain-carbon-accounting/oil-and-gas-data-lib/src/oilAndGasAsset";
import { DataSource } from "typeorm"
import { OilAndGasAsset } from "../models/oilAndGasAsset"

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


  public getAllAssets = async (): Promise<OilAndGasAssetInterface[]> => {
    return await this._db.getRepository(OilAndGasAsset).find()
  }

  public countAllAssets = async (): Promise<number> => {
    return await this._db.getRepository(OilAndGasAsset).count()
  }

}
