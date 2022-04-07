import { UtilityLookupItemDbInterface } from "blockchain-carbon-accounting-data-common/db"
import { UtilityLookupItemInterface } from "emissions_data_chaincode/src/lib/utilityLookupItem"
import { DataSource } from "typeorm"
import { UtilityLookupItem } from "../models/utilityLookupItem"

export class UtilityLookupItemRepo implements UtilityLookupItemDbInterface {
  
  private _db: DataSource

  constructor(dbConnection: DataSource) {
    this._db = dbConnection
  }

  public putUtilityLookupItem = async (doc: UtilityLookupItemInterface) => {
    await this._db.getRepository(UtilityLookupItem).save(doc)
  }

  public getUtilityLookupItem = async (uuid: string): Promise<UtilityLookupItemInterface> => {
    return await this._db.getRepository(UtilityLookupItem).findOneBy({uuid})
  }

  public getAllUtilityLookupItems = async (): Promise<UtilityLookupItemInterface[]> => {
    return await this._db.getRepository(UtilityLookupItem).find()
  }

  public countAllUtilityLookupItems = async (): Promise<number> => {
    return await this._db.getRepository(UtilityLookupItem).count()
  }

}
