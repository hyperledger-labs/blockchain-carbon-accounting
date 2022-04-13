import { DataSource, SelectQueryBuilder } from "typeorm"
import { Balance } from "../models/balance"
import { Token } from "../models/token"
import { BalancePayload, buildQueries, QueryBundle } from "./common"

export class BalanceRepo {

  private _db: DataSource

  constructor(dbConnection: DataSource) {
    this._db = dbConnection
  }

  public insert = async (payload: BalancePayload): Promise<void> => {
    await this._db.getRepository(Balance)
      .createQueryBuilder('balance')
      .insert()
      .into(Balance)
      .values(payload)
      .execute()
    return
  }

  public selectBalance = async (issuee: string, tokenId: number): Promise<Balance | null> => {
    try {
      return await this._db.getRepository(Balance)
        .createQueryBuilder('balance')
        .where("balance.tokenId = :tokenId", {tokenId})
        .andWhere('LOWER(balance.issuee) = LOWER(:issuee)', {issuee})
        .getOne()
    } catch (error) {
      throw new Error('cannot select one')
    }
  }

  public selectPaginated = async (offset: number, limit: number, bundles: Array<QueryBundle>) : Promise<Array<Balance>> => {
    try {
      let selectBuilder: SelectQueryBuilder<Balance> = this._db.getRepository(Balance).createQueryBuilder('balance')
      selectBuilder = buildQueries('balance', selectBuilder, bundles)
      return selectBuilder    
        .limit(limit)
        .offset(offset)
        .orderBy('balance.tokenId', 'ASC')
        .leftJoinAndMapOne('balance.token', Token, 'token', 'token.tokenId = balance.tokenId')
        .getMany()
    } catch (error) {
      console.log(error)
      throw new Error('Cannot select balances.')
    }
  }

  public truncateBalances = async () => {
    await this._db.getRepository(Balance)
    .createQueryBuilder('balance')
    .delete()
    .execute()
  }

  public addAvailableBalance = async (issuee: string, tokenId: number, amount: number) => {
    try {
      await this._db.getRepository(Balance)
      .createQueryBuilder('balance')
      .update(Balance)
      .set({available: () => `balance."available" + ${amount}`})
      .where("tokenId = :tokenId", {tokenId})
      .andWhere('LOWER(issuee) = LOWER(:issuee)', {issuee})
      .execute()
    } catch (error) {
      throw new Error(`Cannot add ${tokenId} available balance ${amount} to ${issuee}`)
    }
  }

  public transferBalance = async (issuee: string, tokenId: number, amount: number) => {
    try {
      await this._db.getRepository(Balance)
      .createQueryBuilder('balance')
      .update(Balance)
      .set({
        available: () => `balance."available" - ${amount}`,
        transferred: () => `balance."transferred" + ${amount}`
      })
      .where("tokenId = :tokenId", {tokenId})
      .andWhere('LOWER(issuee) = LOWER(:issuee)', {issuee})
      .execute()
    } catch (error) {
      throw new Error(`Cannot deduct ${tokenId} available balance ${amount} from ${issuee}`)
    }
  }

  public retireBalance = async (issuee: string, tokenId: number, amount: number) => {
    try {
      await this._db.getRepository(Balance)
      .createQueryBuilder('balance')
      .update(Balance)
      .set({
        available: () => `balance."available" - ${amount}`,
        retired: () => `balance."retired" + ${amount}`
      })
      .where("tokenId = :tokenId", {tokenId})
      .andWhere('LOWER(issuee) = LOWER(:issuee)', {issuee})
      .execute()
    } catch (error) {
      throw new Error(`Cannot add ${tokenId} retired balance ${amount} to ${issuee}`)
    }
  }

  public count = (bundles: Array<QueryBundle>): Promise<number> => {
    try {
      let selectBuilder: SelectQueryBuilder<Balance> = this._db.getRepository(Balance).createQueryBuilder("balance")
      selectBuilder = buildQueries('balance', selectBuilder, bundles)
      return selectBuilder
        .leftJoinAndMapOne('balance.token', Token, 'token', 'token.tokenId = balance.tokenId')
        .getCount()
    } catch (error) {
      throw new Error("Cannot get balances count.")       
    }
  }
}
