import { DataSource, SelectQueryBuilder } from "typeorm"
import { TrackerBalance } from "../models/trackerBalance"
import { Tracker } from "../models/tracker"
import { TrackerBalancePayload, buildQueries, QueryBundle, TrackerStatus } from "./common"

export class TrackerBalanceRepo {

  private _db: DataSource

  constructor(dbConnection: DataSource) {
    this._db = dbConnection
  }

  public insert = async (payload: TrackerBalancePayload): Promise<void> => {
    await this._db.getRepository(TrackerBalance)
      .createQueryBuilder('tracker_balance')
      .insert()
      .into(TrackerBalance)
      .values(payload)
      .execute()
    return
  }

  public selectBalance = async (issuedTo: string, trackerId: number): Promise<TrackerBalance | null> => {
    try {
      const balance =  await this._db.getRepository(TrackerBalance)
        .createQueryBuilder('tracker_balance')
        .where("tracker_balance.trackerId = :trackerId", {trackerId})
        .andWhere('LOWER(tracker_balance.issuedTo) = LOWER(:issuedTo)', {issuedTo})
        .getOne()
        return balance;
    } catch (error) {
      return null;
      //throw new Error(`Error selecting one: ${error}`)
    }
  }

  public selectPaginated = async (offset: number, limit: number, bundles: Array<QueryBundle>) => {
    try {
      let selectBuilder = await this._db.getRepository(TrackerBalance).createQueryBuilder('tracker_balance')
      selectBuilder = buildQueries('tracker_balance', selectBuilder, bundles, [TrackerBalance, Tracker])
      return await selectBuilder
        .limit(limit)
        .offset(offset)
        .orderBy('tracker_balance.trackerId', 'ASC')
        .leftJoinAndMapOne('tracker_balance.tracker', Tracker, 'tracker', 'tracker."trackerId" = tracker_balance."trackerId"')
        .getMany()
    } catch (error) {
      console.log(error)
      throw new Error('Cannot select balances.')
    }
  }

  public truncateBalances = async () => {
    await this._db.getRepository(TrackerBalance)
    .createQueryBuilder('tracker_balance')
    .delete()
    .execute()
  }

  public updateStatus = async (issuedTo: string, trackerId: number, status: TrackerStatus) => {
    try {
      await this._db.getRepository(TrackerBalance)
      .createQueryBuilder('tracker_balance')
      .update(TrackerBalance)
      .set({status: () => `${status}`})
      .where("trackerId = :trackerId", {trackerId})
      .andWhere('LOWER(issuedTo) = LOWER(:issuedTo)', {issuedTo})
      .execute()
    } catch (error) {
      throw new Error(`Cannot update TrackerStatus of ${trackerId} to ${status}`)
    }
  }

  /*public addAvailableBalance = async (issuedTo: string, tokenId: number, amount: bigint) => {
    try {
      await this._db.getRepository(TrackerBalance)
      .createQueryBuilder('tracker_balance')
      .update(TrackerBalance)
      .set({available: () => `tracker_balance.available + ${amount}`})
      .where("tokenId = :tokenId", {tokenId})
      .andWhere('LOWER(issuedTo) = LOWER(:issuedTo)', {issuedTo})
      .execute()
    } catch (error) {
      throw new Error(`Cannot add ${tokenId} available tracker_balance ${amount} to ${issuedTo}`)
    }
  }

  public transferBalance = async (issuedTo: string, tokenId: number, amount: bigint) => {
    try {
      await this._db.getRepository(TrackerBalance)
      .createQueryBuilder('tracker_balance')
      .update(TrackerBalance)
      .set({
        available: () => `tracker_balance.available - ${amount}`,
        transferred: () => `tracker_balance.transferred + ${amount}`
      })
      .where("tokenId = :tokenId", {tokenId})
      .andWhere('LOWER(issuedTo) = LOWER(:issuedTo)', {issuedTo})
      .execute()
    } catch (error) {
      throw new Error(`Cannot deduct ${tokenId} available tracker_balance ${amount} from ${issuedTo}`)
    }
  }

  public retireBalance = async (issuedTo: string, tokenId: number, amount: bigint) => {
    try {
      await this._db.getRepository(TrackerBalance)
      .createQueryBuilder('tracker_balance')
      .update(TrackerBalance)
      .set({
        available: () => `tracker_balance.available - ${amount}`,
        retired: () => `tracker_balance.retired + ${amount}`
      })
      .where("tokenId = :tokenId", {tokenId})
      .andWhere('LOWER(issuedTo) = LOWER(:issuedTo)', {issuedTo})
      .execute()
    } catch (error) {
      throw new Error(`Cannot add ${tokenId} retired tracker_balance ${amount} to ${issuedTo}`)
    }
  }*/

  public count = async (bundles: Array<QueryBundle>): Promise<number> => {
    try {
      let selectBuilder: SelectQueryBuilder<TrackerBalance> = await this._db.getRepository(TrackerBalance).createQueryBuilder("tracker_balance")
      selectBuilder = buildQueries('tracker_balance', selectBuilder, bundles, [TrackerBalance, Tracker])
      return selectBuilder
        .leftJoinAndMapOne('tracker_balance.tracker', Tracker, 'tracker', 'tracker.trackerId = tracker_balance.trackerId')
        .getCount()
    } catch (error) {
      throw new Error("Cannot get balances count.")       
    }
  }
}
