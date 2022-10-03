import type { AssetOperatorInterface } from "@blockchain-carbon-accounting/oil-and-gas-data-lib";
import { AssetOperator } from "../models/assetOperator"
import { Operator } from "../models/operator"
import { DataSource, } from "typeorm"

export class AssetOperatorRepo {

  private _db: DataSource

  constructor(dbConnection: DataSource) {
    this._db = dbConnection
  }
  
  public putAssetOperator = async (doc: AssetOperatorInterface) => {
    // cleanup any existing record matching the scope/l1/../l4/text/activity_uom and year
    await this._db.getRepository(AssetOperator).save(doc)
    const operator = await this._db.getRepository(Operator).findOneBy({uuid: doc.operator.uuid})
    if(operator){
      operator.asset_count += 1;
      await this._db.getRepository(Operator).save(operator)
    }
  }

  public getAssetOwner = async (uuid: string): Promise<AssetOperator | null> => {
    return await this._db.getRepository(AssetOperator).findOneBy({uuid})
  }

  public getAssetOwners = async (): Promise<AssetOperator[]> => {
    return await this._db.getRepository(AssetOperator).find()
  }

  public countAssetOwners = async (): Promise<number> => {
    return await this._db.getRepository(AssetOperator).count()
  }

}