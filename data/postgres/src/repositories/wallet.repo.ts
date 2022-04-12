import { DataSource, SelectQueryBuilder } from "typeorm"
import { Wallet } from "../models/wallet"
import { buildQueries, QueryBundle } from "./common"


const ALIAS = 'wallet';

export class WalletRepo {

  private _db: DataSource

  constructor(dbConnection: DataSource) {
    this._db = dbConnection
  }

  public selectAll = async (): Promise<Array<Wallet>> => {
    return await this._db.getRepository(Wallet).find()
  }

  public selectPaginated = async (offset: number, limit: number, bundles: Array<QueryBundle>): Promise<Array<Wallet>> => {
    let selectBuilder: SelectQueryBuilder<Wallet> = this._db.getRepository(Wallet).createQueryBuilder(ALIAS)
    selectBuilder = buildQueries(ALIAS, selectBuilder, bundles)
    return await selectBuilder
      .limit(limit)
      .offset(offset)
      .orderBy(`${ALIAS}.name`, 'ASC')
      .addOrderBy(`${ALIAS}.address`, 'ASC')
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
      ...payload,
    })
  }

  public countWallets = async (bundles: Array<QueryBundle>): Promise<number> => {
    try {
      let selectBuilder: SelectQueryBuilder<Wallet> = this._db.getRepository(Wallet).createQueryBuilder(ALIAS)
      selectBuilder = buildQueries(ALIAS, selectBuilder, bundles)
      return selectBuilder.getCount()
    } catch (error) {
      throw new Error("Cannot get wallets count.")       
    }
  }

  private makeLookupQuery = (query: string) => {
    return this._db.getRepository(Wallet)
      .createQueryBuilder(ALIAS) 
      .where(`LOWER(${ALIAS}.address) LIKE LOWER(:query)`, {query})
      .orWhere(`LOWER(${ALIAS}.name) LIKE LOWER(:query)`, {query})
  }

  public lookupPaginated = async (offset: number, limit: number, query: string): Promise<Array<Wallet>> => {
    return await this.makeLookupQuery(query) 
      .limit(limit)
      .offset(offset)
      .orderBy(`${ALIAS}.name`, 'ASC')
      .addOrderBy(`${ALIAS}.address`, 'ASC')
      .getMany()
  }

  public countLookupWallets = async (query: string): Promise<number> => {
    try {
      return await this.makeLookupQuery(query) 
        .getCount()
    } catch (error) {
      throw new Error("Cannot get wallets count.")       
    }
  }

  public ensureWalletWithRoles = async(address: string, roles: string[], data?: Partial<Wallet>) => {
    const repo = this._db.getRepository(Wallet);
    let wallet = await repo.findOneBy({address});
    console.log('got wallet for address',address,wallet)
    if (!wallet) {
      wallet = repo.create({address});
    }
    wallet.roles = roles.join(',');
    if (data) {
      wallet = Object.assign(wallet, data);
    }
    return await repo.save(wallet);
  }

  public truncateWallets = async () => {
    await this._db.getRepository(Wallet)
    .createQueryBuilder(ALIAS)
    .delete()
    .execute()
  }
}


