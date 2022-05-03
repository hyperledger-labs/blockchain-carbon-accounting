import { DataSource, SelectQueryBuilder } from "typeorm"
import { Token } from "../models/token"
import { buildQueries, QueryBundle, TrackerPayload } from "./common"

export class TrackerRepo {

  private _db: DataSource

  constructor(dbConnection: DataSource) {
    this._db = dbConnection
  }

  public selectAll = async (): Promise<Array<Tracker>> => {
    const tokenRepository = this._db.getRepository(Tracker)
    return await tokenRepository.find()
  }

  public selectPaginated = async (offset: number, limit: number, bundles: Array<QueryBundle>): Promise<Array<Tracker>> => {
    let selectBuilder: SelectQueryBuilder<Tracker> = this._db.getRepository(Tracker).createQueryBuilder("tracker")

    // category by issuer address
    selectBuilder = buildQueries('token', selectBuilder, bundles)
    return selectBuilder
      .limit(limit)
      .offset(offset)
      .orderBy('tracker.trackerId', 'ASC')
      .getMany()
  }

  public selectToken = async (trackerId: number): Promise<Tracker | null> => {
    return await this._db.getRepository(Tracker).findOneBy({trackerId})
  }

  public insertTracker = async (payload: TrackerPayload): Promise<Tracker> => {
    const trackerRepository = this._db.getRepository(Tracker)
    const Tracker = new Tracker()
    return await tokenRepository.save({
      ...tracker,
      ...payload
    })
  }


  public countTokens = async (bundles: Array<QueryBundle>): Promise<number> => {
    try {
      let selectBuilder: SelectQueryBuilder<Tracker> = this._db.getRepository(Tracker).createQueryBuilder("tracker")
      selectBuilder = buildQueries('tracker', selectBuilder, bundles)
      return selectBuilder.getCount()
    } catch (error) {
      throw new Error("Cannot get trackers count.")       
    }
  }

  public truncateTokens = async () => {
    await this._db.getRepository(Token)
    .createQueryBuilder('tracker')
    .delete()
    .execute()
  }
}

