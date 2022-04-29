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
    const item = new UtilityLookupItem()

    item.class = doc.class
    item.key = doc.key
    item.uuid = doc.uuid
    item.year = doc.year
    item.utility_number = doc.utility_number
    item.utility_name = doc.utility_name
    item.country = doc.country
    item.state_province = doc.state_province
    if (doc.divisions) {
      item.division_type = doc.divisions.division_type
      item.division_id = doc.divisions.division_id
    }

    await this._db.getRepository(UtilityLookupItem).save(item)
  }

  public getUtilityLookupItem = async (uuid: string): Promise<UtilityLookupItemInterface | null> => {
    return await this._db.getRepository(UtilityLookupItem).findOneBy({uuid})
  }

  public getAllUtilityLookupItems = async (): Promise<UtilityLookupItemInterface[]> => {
    return await this._db.getRepository(UtilityLookupItem).find()
  }

  public countAllUtilityLookupItems = async (): Promise<number> => {
    return await this._db.getRepository(UtilityLookupItem).count()
  }

}
