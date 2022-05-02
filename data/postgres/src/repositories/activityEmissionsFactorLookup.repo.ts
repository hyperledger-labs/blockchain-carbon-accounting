import { DataSource } from "typeorm"
import { ActivityEmissionsFactorLookup } from "../models/activityEmissionsFactorLookup"

export class ActivityEmissionsFactorLookupRepo {

  private _db: DataSource

  constructor(dbConnection: DataSource) {
    this._db = dbConnection
  }

  public getActivityEmissionsFactorLookup = async (mode: string, type: string): Promise<ActivityEmissionsFactorLookup | null> => {
    return await this._db.getRepository(ActivityEmissionsFactorLookup).findOneBy({mode, type})
  }

  public putActivityEmissionsFactorLookup = async (a: ActivityEmissionsFactorLookup): Promise<ActivityEmissionsFactorLookup | null> => {
    return await this._db.getRepository(ActivityEmissionsFactorLookup).save(a)
  }

}
