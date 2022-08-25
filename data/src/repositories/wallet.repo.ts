import { DataSource, SelectQueryBuilder } from "typeorm"
import { Wallet } from "../models/wallet"
import { buildQueries, QueryBundle } from "./common"


const ALIAS = 'wallet';

export class WalletRepo {

  private _db: DataSource

  constructor(dbConnection: DataSource) {
    this._db = dbConnection
  }

  public getRepository() {
    return this._db.getRepository(Wallet);
  }

  public selectAll = async (): Promise<Array<Wallet>> => {
    return await this.getRepository().find()
  }

  public selectPaginated = async (offset: number, limit: number, bundles: Array<QueryBundle>): Promise<Array<Wallet>> => {
    let selectBuilder: SelectQueryBuilder<Wallet> = this.getRepository().createQueryBuilder(ALIAS)
    selectBuilder = buildQueries(ALIAS, selectBuilder, bundles)
    return await selectBuilder
      .limit(limit)
      .offset(offset)
      .orderBy(`${ALIAS}.name`, 'ASC')
      .addOrderBy(`${ALIAS}.address`, 'ASC')
      .getMany()
  }

  public selectWallet = async (address: string): Promise<Wallet | null> => {
    return await this.getRepository().findOneBy({ address })
  }

  public selectWalletByEncPubKey = async (public_key: string): Promise<Wallet | null> => {
    return await this.getRepository().findOneBy({ public_key })
  }

  public getAuditorsWithPublicKey = async (): Promise<Wallet[]> => {
    return await this.getRepository()
      .createQueryBuilder(ALIAS)
      .where(`LOWER(${ALIAS}.roles) LIKE LOWER(:role)`, { role: '%Emissions Auditor%' })
      .andWhere(`((${ALIAS}.public_key IS NOT NULL AND ${ALIAS}.public_key != '') OR (${ALIAS}.metamask_encrypted_public_key IS NOT NULL AND ${ALIAS}.metamask_encrypted_public_key != ''))`)
      .getMany()
  }

  public getAuditorsWithRsaPublicKey = async (): Promise<Wallet[]> => {
    return await this.getRepository()
      .createQueryBuilder(ALIAS)
      .where(`${ALIAS}.public_key IS NOT NULL`)
      .andWhere(`${ALIAS}.public_key != ''`)
      .andWhere(`LOWER(${ALIAS}.roles) LIKE LOWER(:role)`, { role: '%Emissions Auditor%' })
      .getMany()
  }

  public getAuditorsWithMetamaskPubKey = async (): Promise<Wallet[]> => {
    return await this.getRepository()
      .createQueryBuilder(ALIAS)
      .where(`${ALIAS}.metamask_encrypted_public_key IS NOT NULL`)
      .andWhere(`${ALIAS}.metamask_encrypted_public_key != ''`)
      .andWhere(`LOWER(${ALIAS}.roles) LIKE LOWER(:role)`, { role: '%Emissions Auditor%' })
      .getMany();
  }

  public mergeWallet = async (payload: Partial<Wallet> & Pick<Wallet, 'address'>): Promise<Wallet> => {
    const repo = this.getRepository()
    // lookup case-insensitive, case is used as a checksums only
    const wallet = await this.findWalletByAddress(payload.address)
    console.log('mergeWallet found', wallet)
    if (!wallet) {
      return await repo.save({
        ...payload,
      })
    } else {
      // only update defined new values as API could accept optional values
      const toMerge = Object.fromEntries(
        Object.entries(payload).filter(([, v]) => !!v || v === '')
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
    console.log('insertWallet ', payload)
    return await this.getRepository().save({
      ...payload,
    })
  }

  public findWalletByEmail = async (email: string, with_private_fields?: boolean): Promise<Wallet | null> => {
    const q = this.getRepository()
      .createQueryBuilder(ALIAS)
      .where(`LOWER(${ALIAS}.email) LIKE LOWER(:email)`, { email: email.trim() })

    if (with_private_fields) {
      q.addSelect(`${ALIAS}.email_verified`)
      q.addSelect(`${ALIAS}.password_reset_token`)
      q.addSelect(`${ALIAS}.password_reset_token_sent_at`)
      q.addSelect(`${ALIAS}.verification_token`)
      q.addSelect(`${ALIAS}.verification_token_sent_at`)
      q.addSelect(`${ALIAS}.private_key`)
      q.addSelect(`${ALIAS}.password_hash`)
      q.addSelect(`${ALIAS}.password_salt`)
      q.addSelect(`${ALIAS}.private_key`)
    }
    return await q.getOne()
  }

  public changePassword = async (email: string, password: string) => {
    const { password_hash, password_salt } = Wallet.generateHash(password);
    this.getRepository().createQueryBuilder()
      .update(Wallet)
      .set({
        password_reset_token: '',
        password_hash,
        password_salt
      })
      .where(`LOWER(email) LIKE LOWER(:email)`, { email: email.trim() })
      .execute();
  }

  public markPasswordResetRequested = async (email: string, token: string) => {
    this.getRepository().createQueryBuilder()
      .update(Wallet)
      .set({
        password_reset_token: token,
        password_reset_token_sent_at: new Date(),
      })
      .where(`LOWER(email) LIKE LOWER(:email)`, { email : email.trim()})
      .execute();
  }

  public markEmailVerified = async (email: string) => {
    this.getRepository().createQueryBuilder()
      .update(Wallet)
      .set({
        verification_token: '', 
        email_verified: true,
      })
      .where(`LOWER(email) LIKE LOWER(:email)`, { email: email.trim() })
      .execute();
  }

  public markPkExported = async (address: string) => {
    this.getRepository().createQueryBuilder()
      .update(Wallet)
      .set({
        private_key: '',
      })
      .where(`LOWER(address) LIKE LOWER(:address)`, { address })
      .execute();
  }

  public countWallets = async (bundles: Array<QueryBundle>): Promise<number> => {
    try {
      let selectBuilder: SelectQueryBuilder<Wallet> = this.getRepository().createQueryBuilder(ALIAS)
      selectBuilder = buildQueries(ALIAS, selectBuilder, bundles)
      return selectBuilder.getCount()
    } catch (error) {
      throw new Error("Cannot get wallets count.")
    }
  }

  /** Returns the wallet by given address value, case-insensitive. */
  public findWalletByAddress = async (address: string) => {
    return await this.getRepository()
      .createQueryBuilder(ALIAS)
      .where(`LOWER(${ALIAS}.address) LIKE LOWER(:address)`, { address })
      .getOne()
  }

  private makeLookupQuery = (query: string) => {
    return this.getRepository()
      .createQueryBuilder(ALIAS)
      .where(`LOWER(${ALIAS}.address) LIKE LOWER(:query)`, { query })
      .orWhere(`LOWER(${ALIAS}.name) LIKE LOWER(:query)`, { query })
      .orWhere(`LOWER(${ALIAS}.organization) LIKE LOWER(:query)`, { query })
  }

  public lookupPaginated = async (offset: number, limit: number, query: string): Promise<Array<Wallet>> => {
    // i want to customize the orderby so that better matches are put first
    // this means escaping the user given value and generating a WHERE like statement
    // to use as order clause, perhaps the best way here is to use a custom
    // prepared statement:
    const res = await this.getRepository().query(
      `SELECT address, name, organization, roles, email FROM wallet
       WHERE LOWER(address) LIKE LOWER($1)
       OR LOWER(name) LIKE LOWER($1)
       OR LOWER(organization) LIKE LOWER($1)
       ORDER BY LOWER(address) LIKE LOWER($1) DESC,
       LOWER(name) LIKE LOWER($1) DESC,
       LOWER(organization) LIKE LOWER($1) DESC,
       LOWER(name) ASC
       LIMIT $2 OFFSET $3`,
      [ query, limit, offset ])
    return res as Wallet[];
  }

  public countLookupWallets = async (query: string): Promise<number> => {
    try {
      // special ordering from above does not matter for the count
      return await this.makeLookupQuery(query)
        .getCount()
    } catch (error) {
      throw new Error("Cannot get wallets count.")
    }
  }

  /** Update or create the Wallet with given address to have the given roles exactly.  */
  public ensureWalletWithRoles = async (address: string, roles: string[], data?: Partial<Wallet>) => {
    return await this.mergeWallet({ ...data, address, roles: roles.join(',') });
  }

  /** Update or create the Wallet with given address to have at least the given roles.  */
  public ensureWalletHasRoles = async (address: string, roles: string[]) => {
    const wallet = await this.findWalletByAddress(address)
    if (!wallet || !wallet.roles) {
      return await this.getRepository().save({ address, roles: roles.join(',') })
    } else {
      const rolesArr = wallet.roles.split(',')
      for (const r of roles) {
        if (rolesArr.indexOf(r) === -1) {
          rolesArr.push(r)
        }
      }
      wallet.roles = rolesArr.join(',')
      return await this.getRepository().save(wallet)
    }
  }

  /** Update or create the Wallet with given address to NOT have the given roles.  */
  public ensureWalletHasNotRoles = async (address: string, roles: string[]) => {
    const wallet = await this.findWalletByAddress(address)
    if (!wallet || !wallet.roles) {
      return await this.getRepository().save({ address })
    } else {
      // remove all roles that were given
      const rolesArr = wallet.roles.split(',').filter((r) => roles.indexOf(r) === -1)
      wallet.roles = rolesArr.join(',')
      return await this.getRepository().save(wallet)
    }
  }

  public truncateWallets = async () => {
    await this.getRepository()
      .createQueryBuilder(ALIAS)
      .delete()
      .execute()
  }

  public clearWalletsRoles = async () => {
    await this.getRepository().update({}, { roles: '' });
  }
}
