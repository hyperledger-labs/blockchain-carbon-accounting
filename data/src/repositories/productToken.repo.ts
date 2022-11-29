import { DataSource, SelectQueryBuilder } from "typeorm"
import { ProductToken } from "../models/productToken"
import { buildQueries, QueryBundle, ProductTokenPayload } from "./common"

export class ProductTokenRepo {

  private _db: DataSource

  constructor(dbConnection: DataSource) {
    this._db = dbConnection
  }

  public selectAll = async (): Promise<Array<ProductToken>> => {
    const ProductTokenRepository = await this._db.getRepository(ProductToken)
    return await ProductTokenRepository.find()
  }

  public selectPaginated = async (offset: number, limit: number, bundles: Array<QueryBundle>): Promise<Array<ProductToken>> => {
    let selectBuilder: SelectQueryBuilder<ProductToken> = await this._db.getRepository(ProductToken).createQueryBuilder("product_token")

    // category by issuer address
    selectBuilder = buildQueries('product_token', selectBuilder, bundles)
    return selectBuilder
      .limit(limit)
      .offset(offset)
      .orderBy('product_token.productId', 'ASC')
      .getMany()
  }

  public selectProduct = async (productId: number): Promise<ProductToken | null> => {
    return await this._db.getRepository(ProductToken)
      //.innerJoinAndSelect("product_token.tracker", "tracker")
      .findOneBy({productId})
  }

  public insertProductToken = async (payload: ProductTokenPayload): Promise<ProductToken> => {
    const ProductTokenRepository = await this._db.getRepository(ProductToken)
    const product = new ProductToken()
    return await ProductTokenRepository.save({
      ...product,
      ...payload
    })
  }
  
  public updateAvailable = async (productId: number, amount: bigint) => {
    try {
      await this._db.getRepository(ProductToken)
      .createQueryBuilder('product_token')
      .update(ProductToken)
      .set({available: () => `product_token.available - ${amount}`})
      .where("productId = :productId", {productId})
      .execute()    
    } catch (error) {
      throw new Error("Cannot update available.")
    }
  }

  public updateRetired = async (productId: number, amount: bigint) => {
    try {
      await this._db.getRepository(ProductToken)
      .createQueryBuilder('product_token')
      .update(ProductToken)
      .set({retired: () => `product_token.retired + ${amount}`})
      .where("productId = :productId", {productId})
      .execute()    
    } catch (error) {
      throw new Error("Cannot update retired.")
    }
  }

  public setDateCreated = async (productId: number, dateCreated: number) => {
    try {
      await this._db.getRepository(ProductToken)
      .createQueryBuilder('product_token')
      .update(ProductToken)
      .set({dateCreated})
      .where("productId = :productId", {productId})
      .execute()    
    } catch (error) {
      throw new Error(`Cannot set dateCreated:: ${error}`)
    }
  }

  public setDateUpdated = async (productId: number, dateUpdated: number) => {
    try {
      await this._db.getRepository(ProductToken)
      .createQueryBuilder('product_token')
      .update(ProductToken)
      .set({dateUpdated})
      .where("productId = :productId", {productId})
      .execute()    
    } catch (error) {
      throw new Error(`Cannot set dateUpdated:: ${error}`)
    }
  }

  public countProducts = async (bundles: Array<QueryBundle>): Promise<number> => {
    try {
      let selectBuilder: SelectQueryBuilder<ProductToken> = await this._db.getRepository(ProductToken).createQueryBuilder("product_token")
      selectBuilder = buildQueries('product_token', selectBuilder, bundles)
      return selectBuilder.getCount()
    } catch (error) {
      throw new Error("Cannot get products count.")       
    }
  }

  public truncateProducts = async () => {
    await this._db.getRepository(ProductToken)
    .createQueryBuilder('product')
    .delete()
    .execute()
  }
}

