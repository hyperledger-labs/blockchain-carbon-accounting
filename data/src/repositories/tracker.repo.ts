import { DataSource, SelectQueryBuilder } from "typeorm"
import { Tracker } from "../models/tracker"
import { TrackerBalance } from "../models/trackerBalance"
import { TrackedProduct } from "../models/trackedProduct"
import { TrackedToken } from "../models/trackedToken"
import { ProductToken } from "../models/productToken"
import { ProductTokenBalance } from "../models/productTokenBalance"
import { Token } from "../models/token"
import { Balance } from "../models/balance"
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

  public countTrackers = async (bundles: Array<QueryBundle>,issuedTo: string, tokenTypeId: number): Promise<number> => {
    try {
      let selectBuilder: SelectQueryBuilder<Tracker> = 
        await this._db.getRepository(Tracker).createQueryBuilder("tracker")
      selectBuilder = buildQueries('tracker', selectBuilder, bundles)
      if(tokenTypeId===1){
        return await selectBuilder
          .innerJoin("tracker.balances", "tracker_balance")
          .where(`LOWER(tracker_balance.issuedTo) = LOWER(:issuedTo)`, {issuedTo})
          .getCount()
      }else if (tokenTypeId===2){
        return await selectBuilder
          .innerJoin("tracker.products", "product_token")
          .innerJoin("product_token.balances", "product_token_balance")
          .where(`LOWER(product_token_balance.issuedTo) = LOWER(:issuedTo)`, {issuedTo})
          .getCount()      
      }else{
        return await selectBuilder.getCount()   
      }
    } catch (error) {
      throw new Error(`Cannot get trackers count:: ${error}`)       
    }
  }

  public selectPaginated = async (offset: number, limit: number, bundles: Array<QueryBundle>,issuedTo: string, tokenTypeId: number): Promise<Array<Tracker>> => {
    let selectBuilder: SelectQueryBuilder<Tracker> = 
      await this._db.getRepository(Tracker).createQueryBuilder("tracker")
    selectBuilder = buildQueries('tracker', selectBuilder, bundles , [Tracker, ProductTokenBalance])
    let trackers; 

    if(tokenTypeId===1){
      trackers=await selectBuilder
        .innerJoin("tracker.balances", "tracker_balance")
        .where(`LOWER(tracker_balance.issuedTo) = LOWER(:issuedTo)`, {issuedTo})
        .limit(limit)
        .offset(offset)
        .getMany()
    }else if (tokenTypeId===2){
      trackers=await selectBuilder
        .innerJoin("tracker.products", "product_token")
        .innerJoin("product_token.balances", "product_token_balance")
        .where(`LOWER(product_token_balance.issuedTo) = LOWER(:issuedTo)`, {issuedTo})
        .limit(limit)
        .offset(offset)
        .getMany()      
    }else{
      trackers=await selectBuilder
        .limit(limit)
        .offset(offset)
        .getMany()   
    }

    for(const tracker of trackers){
      tracker.balances = await this._db.getRepository(TrackerBalance)
        .createQueryBuilder("tracker_balance")
        .andWhere(`LOWER(tracker_balance.issuedTo) = LOWER(:issuedTo)`, {issuedTo})
        .getMany()
      tracker.products = await this._db.getRepository(ProductToken)
        .createQueryBuilder("product_token")
        .where(`product_token.trackerId = ${tracker.trackerId}`)
        .andWhere(`product_token.issued > 0`)
        .getMany()
      for(const product of tracker.products){
        product.balances = await this._db.getRepository(ProductTokenBalance)
        .createQueryBuilder("product_token_balance")
        .where(`product_token_balance.productId = ${product.productId}`)
        .andWhere(`LOWER(product_token_balance.issuedTo) = LOWER(:issuedTo)`, {issuedTo})
        .getMany()
      }
      tracker.tokens = await this._db.getRepository(TrackedToken)
        .createQueryBuilder("tracked_token")
        .leftJoinAndSelect("tracked_token.token", "token")
        .where(`tracked_token.trackerId = ${tracker.trackerId}`)
        .getMany()
      tracker.trackedProducts = await this._db.getRepository(TrackedProduct)
        .createQueryBuilder("tracked_product")
        .leftJoinAndSelect("tracked_product.product", "product")
        .leftJoinAndSelect("product.tracker", "tracker")
        .where(`tracked_product.trackerId = ${tracker.trackerId}`)
        .getMany()
    }
    return trackers
  }

  public select = async (trackerId: number): Promise<Tracker | null> => {
    try{
      return await this._db.getRepository(Tracker).findOne({
        where: {trackerId}, relations: ['products','tokens']})
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
    return tracker;
  }

  public setRetired = async (tokenId: number) => {
    try {
      await this._db.getRepository(Tracker)
      .createQueryBuilder('tracker')
      .update(Tracker)
      .set({retired: () => `${true}`})
      .where("tokenId = :tokenId", {tokenId})
      .execute()    
    } catch (error) {
      throw new Error(`Cannot set retired: ${error}`)
    }
  }
  public setDateCreated = async (trackerId: number, dateCreated: number) => {
    try {
      await this._db.getRepository(Tracker)
      .createQueryBuilder('tracker')
      .update(Tracker)
      .set({dateCreated})
      .where("trackerId = :trackerId", {trackerId})
      .execute()    
    } catch (error) {
      throw new Error(`Cannot set dateCreated:: ${error}`)
    }
  }
  public setDateUpdated = async (trackerId: number, dateUpdated: number) => {
    try {
      await this._db.getRepository(Tracker)
      .createQueryBuilder('tracker')
      .update(Tracker)
      .set({dateUpdated})
      .where("trackerId = :trackerId", {trackerId})
      .execute()    
    } catch (error) {
      throw new Error(`Cannot set dateUpdated:: ${error}`)
    }
  }
  public setDateIssued = async (trackerId: number, dateIssued: number) => {
    try {
      await this._db.getRepository(Tracker)
      .createQueryBuilder('tracker')
      .update(Tracker)
      .set({dateIssued})
      .where("trackerId = :trackerId", {trackerId})
      .execute()    
    } catch (error) {
      throw new Error(`Cannot set dateIssued:: ${error}`)
    }
  }  
  public setIssuedBy = async (trackerId: number, issuedBy: string) => {
    try {
      await this._db.getRepository(Tracker)
      .createQueryBuilder('tracker')
      .update(Tracker)
      .set({issuedBy})
      .where("trackerId = :trackerId", {trackerId})
      .execute()    
    } catch (error) {
      throw new Error(`Cannot set dateIssued:: ${error}`)
    }
  }
  public truncateTrackers = async () => {

    await this._db.getRepository(TrackedProduct)
    .createQueryBuilder()
    .delete()
    .execute()

    await this._db.getRepository(TrackedToken)
    .createQueryBuilder()
    .delete()
    .execute()

    await this._db.getRepository(Balance)
    .createQueryBuilder()
    .delete()
    .execute()
    
    await this._db.getRepository(Token)
    .createQueryBuilder()
    .delete()
    .execute()

    await this._db.getRepository(TrackerBalance)
    .createQueryBuilder()
    .delete()
    .execute()

    await this._db.getRepository(ProductTokenBalance)
    .createQueryBuilder()
    .delete()
    .execute()

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

