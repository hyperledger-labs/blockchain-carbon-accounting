import { DataSource } from "typeorm"
import { TrackedToken } from "../models/trackedToken"
import { TrackedTokenPayload } from "./common"

export class TrackedTokenRepo {

  private _db: DataSource

  constructor(dbConnection: DataSource) {
    this._db = dbConnection
  }

  public select = async (trackerId: number, tokenId: number): Promise<TrackedToken | null> => {
    return await this._db.getRepository(TrackedToken).findOneBy({trackerId, tokenId})
  }
  public insert = async (payload: TrackedTokenPayload): Promise<TrackedToken> => {
    const TrackedTokenRepository = await this._db.getRepository(TrackedToken)
    const trackedToken = new TrackedToken()
    return await TrackedTokenRepository.save({
      ...trackedToken,
      ...payload
    })
  }
}

