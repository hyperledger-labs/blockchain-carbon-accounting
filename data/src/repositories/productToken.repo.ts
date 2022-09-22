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
    let selectBuilder: SelectQueryBuilder<ProductToken> = await this._db.getRepository(ProductToken).createQueryBuilder("product")

    // category by issuer address
    selectBuilder = buildQueries('product', selectBuilder, bundles)
    return selectBuilder
      .limit(limit)
      .offset(offset)
      .orderBy('product.productId', 'ASC')
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


  public countProducts = async (bundles: Array<QueryBundle>): Promise<number> => {
    try {
      let selectBuilder: SelectQueryBuilder<ProductToken> = await this._db.getRepository(ProductToken).createQueryBuilder("productToken")
      selectBuilder = buildQueries('productToken', selectBuilder, bundles)
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

