import { DataSource, SelectQueryBuilder } from "typeorm"
import { Tracker } from "../models/tracker"
import { buildQueries, QueryBundle, TrackerPayload } from "./common"

export class TrackerRepo {

  private _db: DataSource

  constructor(dbConnection: DataSource) {
    this._db = dbConnection
  }

  public selectAll = async (): Promise<Array<Tracker>> => {
    const trackerRepository = await this._db.getRepository(Tracker)
    return await trackerRepository.find()
  }

  public selectPaginated = async (offset: number, limit: number, bundles: Array<QueryBundle>): Promise<Array<Tracker>> => {
    let selectBuilder: SelectQueryBuilder<Tracker> = await this._db.getRepository(Tracker).createQueryBuilder("tracker")

    // category by issuer address
    selectBuilder = buildQueries('tracker', selectBuilder, bundles)
    return selectBuilder
      .limit(limit)
      .offset(offset)
      .orderBy('tracker.trackerId', 'ASC')
      .getMany()
  }

  public selectTracker = async (trackerId: number): Promise<Tracker | null> => {
    return await this._db.getRepository(Tracker).findOneBy({trackerId})
  }

  public insertTracker = async (payload: TrackerPayload): Promise<Tracker> => {
    const trackerRepository = await this._db.getRepository(Tracker)
    const tracker = new Tracker()
    return await trackerRepository.save({
      ...tracker,
      ...payload
    })
  }


  public countTrackers = async (bundles: Array<QueryBundle>): Promise<number> => {
    try {
      let selectBuilder: SelectQueryBuilder<Tracker> = await this._db.getRepository(Tracker).createQueryBuilder("tracker")
      selectBuilder = buildQueries('tracker', selectBuilder, bundles)
      return selectBuilder.getCount()
    } catch (error) {
      throw new Error(`Cannot get trackers count:: ${error}`)       
    }
  }

  public truncateTrackers = async () => {
    await this._db.getRepository(Tracker)
    .createQueryBuilder('tracker')
    .delete()
    .execute()
  }
}

