import type { AssetOwnerInterface } from "@blockchain-carbon-accounting/oil-and-gas-data-lib";
import { AssetOwner } from "../models/assetOwner"
import { DataSource, } from "typeorm"

export class AssetOwnerRepo {

  private _db: DataSource

  constructor(dbConnection: DataSource) {
    this._db = dbConnection
  }
  
  public putAssetOwner = async (doc: AssetOwnerInterface) => {
    // cleanup any existing record matching the scope/l1/../l4/text/activity_uom and year
    const repo = await this._db.getRepository(AssetOwner)
    await this._db.getRepository(AssetOwner).save(doc)
  }

  public getAssetOwner = async (uuid: string): Promise<AssetOwner | null> => {
    return await this._db.getRepository(AssetOwner).findOneBy({uuid})
  }


  public getAssetOwners = async (): Promise<AssetOwner[]> => {
    return await this._db.getRepository(AssetOwner).find()
  }

  public countAssetOwners = async (): Promise<number> => {
    return await this._db.getRepository(AssetOwner).count()
  }

}