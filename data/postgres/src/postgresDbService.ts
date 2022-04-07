import { DataSource } from "typeorm"
import { DbOpts, parseCommonYargsOptions } from "./config"
import { initDb } from './models'
import { BalanceRepo } from "./repositories/balance.repo"
import { EmissionsFactorRepo } from "./repositories/emissionsFactor.repo"
import { TokenRepo } from "./repositories/token.repo"
import { UtilityLookupItemRepo } from "./repositories/utilityLookupItem.repo"


export class PostgresDBService {

  private _db: DataSource
  private static _instance: PostgresDBService
  private static _instanceLoading: Promise<PostgresDBService>

  public static getInstance = async (opts?: DbOpts): Promise<PostgresDBService> => {
    if (PostgresDBService._instance) return PostgresDBService._instance
    if (!PostgresDBService._instanceLoading) {
      PostgresDBService._instanceLoading = PostgresDBService.connect(opts)
    }
    return await PostgresDBService._instanceLoading
  }

  private static connect = async (opts?: DbOpts): Promise<PostgresDBService> => {

    // get default options
    if (!opts) opts = parseCommonYargsOptions({})
    
    try {
      const db = await initDb(opts)
      return new PostgresDBService(db)
    } catch (error) {
      throw new Error('Error initializing the DB:' + error)
    }
  }

  constructor(dbConnection: DataSource) {
    this._db = dbConnection
  }

  public async close() {
    await this._db.destroy()
    PostgresDBService._instance = null
  }

  public getEmissionsFactorRepo() {
    return new EmissionsFactorRepo(this._db)
  }

  public getUtilityLookupItemRepo() {
    return new UtilityLookupItemRepo(this._db)
  }

  public getTokenRepo() {
    return new TokenRepo(this._db)
  }

  public getBalanceRepo() {
    return new BalanceRepo(this._db)
  }
}

