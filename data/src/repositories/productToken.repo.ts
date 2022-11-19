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
    return await this._db.getRepository(ProductToken).findOneBy({productId})
  }

  public insertProductToken = async (payload: ProductTokenPayload): Promise<ProductToken> => {
    const ProductTokenRepository = await this._db.getRepository(ProductToken)
    const product = new ProductToken()
    return await ProductTokenRepository.save({
      ...product,
      ...payload
    })
  }

  public updateIssued = async (tokenId: number, amount: bigint) => {
    try {
      await this._db.getRepository(ProductToken)
      .createQueryBuilder('product_token')
      .update(ProductToken)
      .set({issued: () => `product_token.issued + ${amount}`})
      .where("tokenId = :tokenId", {tokenId})
      .execute()    
    } catch (error) {
      throw new Error("Cannot update issued.")
    }
  }

  public updateAvailable = async (tokenId: number, amount: bigint) => {
    try {
      await this._db.getRepository(ProductToken)
      .createQueryBuilder('product_token')
      .update(ProductToken)
      .set({available: () => `product_token.available - ${amount}`})
      .where("tokenId = :tokenId", {tokenId})
      .execute()    
    } catch (error) {
      throw new Error("Cannot update available.")
    }
  }

  public updateRetired = async (tokenId: number, amount: bigint) => {
    try {
      await this._db.getRepository(ProductToken)
      .createQueryBuilder('product_token')
      .update(ProductToken)
      .set({retired: () => `product_token.retired + ${amount}`})
      .where("tokenId = :tokenId", {tokenId})
      .execute()    
    } catch (error) {
      throw new Error("Cannot update retired.")
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

