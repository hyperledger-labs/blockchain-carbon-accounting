import { DataSource, SelectQueryBuilder } from "typeorm"
import { Product } from "../models/product"
import { buildQueries, QueryBundle, ProductPayload } from "./common"

export class ProductRepo {

  private _db: DataSource

  constructor(dbConnection: DataSource) {
    this._db = dbConnection
  }

  public selectAll = async (): Promise<Array<Product>> => {
    const productRepository = this._db.getRepository(Product)
    return await productRepository.find()
  }

  public selectPaginated = async (offset: number, limit: number, bundles: Array<QueryBundle>): Promise<Array<Product>> => {
    let selectBuilder: SelectQueryBuilder<Product> = this._db.getRepository(Product).createQueryBuilder("product")

    // category by issuer address
    selectBuilder = buildQueries('product', selectBuilder, bundles)
    return selectBuilder
      .limit(limit)
      .offset(offset)
      .orderBy('product.productId', 'ASC')
      .getMany()
  }

  public selectProduct = async (productId: number): Promise<Product | null> => {
    return await this._db.getRepository(Product).findOneBy({productId})
  }

  public insertProduct = async (payload: ProductPayload): Promise<Product> => {
    const productRepository = this._db.getRepository(Product)
    const product = new Product()
    return await productRepository.save({
      ...product,
      ...payload
    })
  }


  public countProducts = async (bundles: Array<QueryBundle>): Promise<number> => {
    try {
      let selectBuilder: SelectQueryBuilder<Product> = this._db.getRepository(Product).createQueryBuilder("product")
      selectBuilder = buildQueries('product', selectBuilder, bundles)
      return selectBuilder.getCount()
    } catch (error) {
      throw new Error("Cannot get products count.")       
    }
  }

  public truncateProducts = async () => {
    await this._db.getRepository(Product)
    .createQueryBuilder('product')
    .delete()
    .execute()
  }
}

