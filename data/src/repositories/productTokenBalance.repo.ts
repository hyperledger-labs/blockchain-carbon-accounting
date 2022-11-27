import { DataSource, SelectQueryBuilder } from "typeorm"
import { ProductTokenBalance } from "../models/productTokenBalance"
import { ProductToken } from "../models/productToken"
import {  ProductTokenBalancePayload, buildQueries, QueryBundle } from "./common"

export class ProductTokenBalanceRepo {

  private _db: DataSource

  constructor(dbConnection: DataSource) {
    this._db = dbConnection
  }

  public insert = async (payload: ProductTokenBalancePayload): Promise<void> => {
    await this._db.getRepository(ProductTokenBalance)
      .createQueryBuilder('product_token_balance')
      .insert()
      .into(ProductTokenBalance)
      .values(payload)
      .execute()
    return
  }

  public selectBalance = async (issuedTo: string, productId: number): Promise<ProductTokenBalance | null> => {
    try {
      const balance = await this._db.getRepository(ProductTokenBalance)
        .createQueryBuilder('product_token_balance')
        .where("product_token_balance.productId = :productId", {productId})
        .andWhere('LOWER(product_token_balance.issuedTo) = LOWER(:issuedTo)', {issuedTo})
        .getOne()
      //const result = await this._db.getRepository(ProductToken).findOneBy({productId})
      //if (result) balance?.product = result;
      return balance;
    } catch (error) {
      return null;
      throw new Error(`Error selecting one: ${error}`)
    }
  }

  public selectPaginated = async (offset: number, limit: number, bundles: Array<QueryBundle>) => {
    try {
      let selectBuilder = await this._db.getRepository(ProductTokenBalance).createQueryBuilder('product_token_balance')
      selectBuilder = buildQueries('product_token_balance', selectBuilder, bundles, [ProductTokenBalance, ProductToken])
      return await selectBuilder
        .limit(limit)
        .offset(offset)
        .orderBy('product_token_balance.productId', 'ASC')
        .leftJoinAndMapOne('product_token_balance.product', ProductToken, 'product', 'product."productId" = product_token_balance."productId"')
        .getMany()
    } catch (error) {
      console.log(error)
      throw new Error('Cannot select balances.')
    }
  }

  public truncateBalances = async () => {
    await this._db.getRepository(ProductTokenBalance)
    .createQueryBuilder('product_token_balance')
    .delete()
    .execute()
  }

  public addAvailableBalance = async (issuedTo: string, productId: number, amount: bigint) => {
    try {
      await this._db.getRepository(ProductTokenBalance)
      .createQueryBuilder('product_token_balance')
      .update(ProductTokenBalance)
      .set({available: () => `product_token_balance.available + ${amount}`})
      .where("productId = :productId", {productId})
      .andWhere('LOWER(issuedTo) = LOWER(:issuedTo)', {issuedTo})
      .execute()
    } catch (error) {
      throw new Error(`Cannot add ${productId} available product_token_balance ${amount} to ${issuedTo}`)
    }
  }

  public transferBalance = async (issuedTo: string, productId: number, amount: bigint) => {
    try {
      await this._db.getRepository(ProductTokenBalance)
      .createQueryBuilder('product_token_balance')
      .update(ProductTokenBalance)
      .set({
        available: () => `product_token_balance.available - ${amount}`,
        transferred: () => `product_token_balance.transferred + ${amount}`
      })
      .where("productId = :productId", {productId})
      .andWhere('LOWER(issuedTo) = LOWER(:issuedTo)', {issuedTo})
      .execute()
    } catch (error) {
      throw new Error(`Cannot deduct ${productId} available product_token_balance ${amount} from ${issuedTo}: ${error}`)
    }
  }

  public retireBalance = async (issuedTo: string, productId: number, amount: bigint) => {
    try {
      await this._db.getRepository(ProductTokenBalance)
      .createQueryBuilder('product_token_balance')
      .update(ProductTokenBalance)
      .set({
        available: () => `product_token_balance.available - ${amount}`,
        retired: () => `product_token_balance.retired + ${amount}`
      })
      .where("productId = :productId", {productId})
      .andWhere('LOWER(issuedTo) = LOWER(:issuedTo)', {issuedTo})
      .execute()
    } catch (error) {
      throw new Error(`Cannot add ${productId} retired product_token_balance ${amount} to ${issuedTo}`)
    }
  }

  public updateAvailable = async (issuedTo: string, productId: number, amount: bigint) => {
    try {
      await this._db.getRepository(ProductTokenBalance)
      .createQueryBuilder('product_token_balance')
      .update(ProductToken)
      .set({available: () => `product_token_balance.available + ${amount}`})
      .where("productId = :productId", {productId})
      .andWhere('LOWER(issuedTo) = LOWER(:issuedTo)', {issuedTo})
      .execute()    
    } catch (error) {
      throw new Error(`Cannot update available: ${error}`)
    }
  }

  public count = async (bundles: Array<QueryBundle>): Promise<number> => {
    try {
      let selectBuilder: SelectQueryBuilder<ProductTokenBalance> = await this._db.getRepository(ProductTokenBalance).createQueryBuilder("product_token_balance")
      selectBuilder = buildQueries('product_token_balance', selectBuilder, bundles, [ProductTokenBalance, ProductToken])
      return selectBuilder
        .leftJoinAndMapOne('product_token_balance.product', ProductToken, 'product', 'product.productId = product_token_balance.productId')
        .getCount()
    } catch (error) {
      throw new Error(`Cannot get balances count: ${error}`)       
    }
  }
}
