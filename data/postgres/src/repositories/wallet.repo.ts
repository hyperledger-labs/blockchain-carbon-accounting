import { DataSource, SelectQueryBuilder } from "typeorm"
import { Wallet } from "../models/wallet"
import { buildQueries, QueryBundle } from "./common"

export class WalletRepo {

  private _db: DataSource

  constructor(dbConnection: DataSource) {
    this._db = dbConnection
  }

  public selectAll = async (): Promise<Array<Wallet>> => {
    return await this._db.getRepository(Wallet).find()
  }

  public selectPaginated = async (offset: number, limit: number, bundles: Array<QueryBundle>): Promise<Array<Wallet>> => {
    let selectBuilder: SelectQueryBuilder<Wallet> = this._db.getRepository(Wallet).createQueryBuilder("wallet")

    // category by issuer address
    selectBuilder = buildQueries('wallet', selectBuilder, bundles)
    return selectBuilder
      .limit(limit)
      .offset(offset)
      .orderBy('wallet.name', 'ASC')
      .getMany()
  }

  public selectWallet = async (address: string): Promise<Wallet | null> => {
    return await this._db.getRepository(Wallet).findOneBy({address})
  }

  public insertWallet = async (payload: Partial<Wallet>): Promise<Wallet> => {
    const repo = this._db.getRepository(Wallet)
    const wallet = new Wallet()
    return await repo.save({
      ...wallet,
      ...payload
    })
  }

  public countWallets = async (bundles: Array<QueryBundle>): Promise<number> => {
    try {
      let selectBuilder: SelectQueryBuilder<Wallet> = this._db.getRepository(Wallet).createQueryBuilder("wallet")
      selectBuilder = buildQueries('wallet', selectBuilder, bundles)
      return selectBuilder.getCount()
    } catch (error) {
      throw new Error("Cannot get wallets count.")       
    }
  }

  public truncateWallets = async () => {
    await this._db.getRepository(Wallet)
    .createQueryBuilder('wallet')
    .delete()
    .execute()
  }
}


