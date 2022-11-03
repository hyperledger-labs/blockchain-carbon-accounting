import { UtilityLookupItemDbInterface } from "@blockchain-carbon-accounting/data-common"
import type { UtilityLookupItemInterface } from "@blockchain-carbon-accounting/emissions_data_lib"
import { DataSource } from "typeorm"
import { UtilityLookupItem } from "../models/utilityLookupItem"

export class UtilityLookupItemRepo implements UtilityLookupItemDbInterface {

  private _db: DataSource

  constructor(dbConnection: DataSource) {
    this._db = dbConnection
  }

  public putUtilityLookupItem = async (doc: UtilityLookupItemInterface) => {
    // cleanup any existing record matching the same fields
    const repo = await this._db.getRepository(UtilityLookupItem);

    await repo.delete({
      class: doc.class,
      year: doc.year,
      utility_number: doc.utility_number,
      utility_name: doc.utility_name,
      country: doc.country,
      state_province: doc.state_province,
      division_type: doc.divisions?.division_type,
      division_id: doc.divisions?.division_id,
    });

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

    await repo.save(item)
  }

  public getUtilityLookupItem = async (uuid: string): Promise<UtilityLookupItemInterface | null> => {
    const result = await this._db.getRepository(UtilityLookupItem).findOneBy({uuid})
    if(!result){
      throw new Error("getUtilityLookupItem: No utility lookup item found")
    }
    return result
  }

  public getAllUtilityLookupItems = async (): Promise<UtilityLookupItemInterface[]> => {
    return await this._db.getRepository(UtilityLookupItem).find()
  }

  public countAllUtilityLookupItems = async (): Promise<number> => {
    return await this._db.getRepository(UtilityLookupItem).count()
  }

}
