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

  public mergeWallet = async (payload: Partial<Wallet> & Pick<Wallet, 'address'>): Promise<Wallet> => {
    const repo = this._db.getRepository(Wallet)
    // lookup case-insensitive, case is used as a checksums only
    const wallet = await this.findWalletByAddress(payload.address)
    console.log('mergeWallet found', wallet)
    if (!wallet) {
      return await repo.save({
        ...payload,
      })
    } else {
      // only update non empty new values
      const toMerge = Object.fromEntries(
        Object.entries(payload).filter(([,v]) => !!v)
      )
      // never update the address
      toMerge.address = wallet.address
      return await repo.save({
        ...wallet,
        ...toMerge
      })
    }
  }

  public insertWallet = async (payload: Partial<Wallet> & Pick<Wallet, 'address'>): Promise<Wallet> => {
    const repo = this._db.getRepository(Wallet)
    console.log('insertWallet ', payload)
    return await repo.save({
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

  private findWalletByAddress = async (address: string) => {
    return await this._db.getRepository(Wallet)
      .createQueryBuilder(ALIAS) 
      .where(`LOWER(${ALIAS}.address) LIKE LOWER(:address)`, {address})
      .getOne()
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
    return await this.mergeWallet({...data, address, roles: roles.join(',') });
  }

  public truncateWallets = async () => {
    await this._db.getRepository(Wallet)
    .createQueryBuilder(ALIAS)
    .delete()
    .execute()
  }
}


