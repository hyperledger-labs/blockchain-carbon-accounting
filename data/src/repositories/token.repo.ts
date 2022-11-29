import { DataSource, SelectQueryBuilder } from "typeorm"
import { Balance } from "../models/balance"
import { Token } from "../models/token"
import { TrackedToken } from "../models/trackedToken"

import { buildQueries, QueryBundle, TokenPayload } from "./common"

export class TokenRepo {

  private _db: DataSource

  constructor(dbConnection: DataSource) {
    this._db = dbConnection
  }

  public selectAll = async (): Promise<Array<Token>> => {
    const tokenRepository = await this._db.getRepository(Token)
    return await tokenRepository.find()
  }

  public selectPaginated = async (offset: number, limit: number, bundles: Array<QueryBundle>): Promise<Array<Token>> => {
    let selectBuilder: SelectQueryBuilder<Token> = await this._db.getRepository(Token).createQueryBuilder("token")

    // category by issuer address
    selectBuilder = buildQueries('token', selectBuilder, bundles)
    return selectBuilder
      .limit(limit)
      .offset(offset)
      .orderBy('token.tokenId', 'ASC')
      .getMany()
  }

  public selectToken = async (tokenId: number): Promise<Token | null> => {
    return await this._db.getRepository(Token).findOneBy({tokenId})
  }

  public selectTokenByEmissionsRequest = async (nodeId: string, requestUuid: string): Promise<Token | null> => {
    try {
      return await this._db.getRepository(Token)
        .createQueryBuilder('token')
        .where("manifest -> 'request_uuid' = :requestUuid", {requestUuid})
        .andWhere("manifest -> 'node_id' = :nodeId", {nodeId})
        .getOne()
    } catch (error) {
      throw new Error('cannot select a token')
    }
  }

  public insertToken = async (payload: TokenPayload): Promise<Token> => {
    const tokenRepository = await this._db.getRepository(Token)
    const token = new Token()
    return await tokenRepository.save({
      ...token,
      ...payload
    })
  }

  public updateTotalIssued = async (tokenId: number, amount: bigint) => {
    try {
      await this._db.getRepository(Token)
      .createQueryBuilder('token')
      .update(Token)
      .set({totalIssued: () => `token."totalIssued" + ${amount}`})
      .where("tokenId = :tokenId", {tokenId})
      .execute()    
    } catch (error) {
      throw new Error("Cannot update totalIssued.")
    }
  }

  public updateTotalRetired = async (tokenId: number, amount: bigint) => {
    try {
      await this._db.getRepository(Token)
      .createQueryBuilder('token')
      .update(Token)
      .set({totalRetired: () => `token."totalRetired" + ${amount}`})
      .where("tokenId = :tokenId", {tokenId})
      .execute()    
    } catch (error) {
      throw new Error("Cannot update totalRetired.")
    }
  }

  public countTokens = async (bundles: Array<QueryBundle>): Promise<number> => {
    try {
      let selectBuilder: SelectQueryBuilder<Token> = await this._db.getRepository(Token).createQueryBuilder("token")
      selectBuilder = buildQueries('token', selectBuilder, bundles)
      return selectBuilder.getCount()
    } catch (error) {
      throw new Error("Cannot get tokens count.")       
    }
  }

  /** Delete all Tokens, first delete all Balances as well. */
  public truncateTokens = async () => {
    await this._db.getRepository(Balance)
    .createQueryBuilder()
    .delete()
    .execute()
    await this._db.getRepository(TrackedToken)
    .createQueryBuilder()
    .delete()
    .execute()
    await this._db.getRepository(Token)
    .createQueryBuilder()
    .delete()
    .execute()
  }
}

