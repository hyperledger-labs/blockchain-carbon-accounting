import { DataSource, SelectQueryBuilder } from "typeorm"
import { Tracker } from "../models/tracker"
import { ProductToken } from "../models/productToken"
import { Token } from "../models/token"
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
    let selectBuilder: SelectQueryBuilder<Tracker> = 
      await this._db.getRepository(Tracker).createQueryBuilder("tracker")
    selectBuilder = buildQueries('tracker', selectBuilder, bundles)
    const trackers = await selectBuilder
      .limit(limit)
      .offset(offset)
      .getMany()

    for(const tracker of trackers){
      tracker.products = await this._db.getRepository(ProductToken)
        .createQueryBuilder("product_token")
        .where(`product_token.trackerId = ${tracker.trackerId}`)
        .andWhere(`product_token.amount > 0`)
        .getMany()
      tracker.tokens = await this._db.getRepository(Token)
        .createQueryBuilder("token")
        .where(`token.trackerId = ${tracker.trackerId}`)
        .getMany()
    }
    console.log(trackers)
    return trackers
  }

  public selectTracker = async (trackerId: number): Promise<Tracker | null> => {
    try{
      let selectBuilder: SelectQueryBuilder<Tracker> = 
        await this._db.getRepository(Tracker).createQueryBuilder("tracker")
      const bundles = [{
        field: 'trackerId',
        fieldType: 'number',
        value: trackerId,
        op: 'eq',
        conjunction: true
      }]
      selectBuilder = buildQueries('tracker', selectBuilder, bundles)
      const tracker = await selectBuilder
        .innerJoinAndSelect("tracker.products", "products")
        .innerJoinAndSelect("tracker.tokens", "tokens")
        .getMany()
      return tracker[0];
    }catch(error){
      throw new Error(`No tracker found with id:: ${trackerId}`)
    }
  }

  public insertTracker = async (payload: TrackerPayload): Promise<Tracker> => {
    const trackerRepository = await this._db.getRepository(Tracker)
    let tracker = new Tracker()
    tracker = await trackerRepository.save({
      ...tracker,
      ...payload
    })
    if(payload.tokens){
      const token = new Tracker()

      for(const tokenPayload of payload.tokens){
        const result = await this._db.getRepository(Token).save({
          ...token,
          ...tokenPayload
        })
      }
    }
    if(payload.products){
      const product = new ProductToken()
      for(const productPayload of payload.products){
        await this._db.getRepository(ProductToken).save({
          ...product,
          ...productPayload
        })
      }
    }
    return tracker;
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
    await this._db.getRepository(ProductToken)
    .createQueryBuilder()
    .delete()
    .execute()

    await this._db.getRepository(Tracker)
    .createQueryBuilder('tracker')
    .delete()
    .execute()
  }

}

