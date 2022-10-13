import { ProductDbInterface } from "@blockchain-carbon-accounting/data-common";
import type { ProductInterface } from "@blockchain-carbon-accounting/oil-and-gas-data-lib";
import { DataSource, SelectQueryBuilder, FindOptionsWhere, ILike } from "typeorm"

import { Product } from "../models/product"
import { OilAndGasAsset } from "../models/oilAndGasAsset"
import { AssetOperator } from "../models/assetOperator"

import { buildQueries, QueryBundle } from "./common"

export class ProductRepo implements ProductDbInterface {

  private _db: DataSource

  constructor(dbConnection: DataSource) {
    this._db = dbConnection
  }
  
  public putProduct = async (doc: ProductInterface) => {
    try{
      const repo = await this._db.getRepository(Product)
      await repo.delete(this.makeProductMatchCondition(doc))
      await this._db.getRepository(Product).save(doc)
    }catch(error){
      throw new Error(`Cannot create product relation:: ${error}`)       
    }
  }

  public getProduct = async (uuid: string): Promise<ProductInterface | null> => {
    return await this._db.getRepository(Product).findOneBy({uuid})
  }

  public getAllProducts = async (): Promise<ProductInterface[]> => {
    return await this._db.getRepository(Product).find()
  }


  public count = async (
    bundles: Array<QueryBundle>, 
    fromAssets?: boolean
  ): Promise<number> => {
    let selectBuilder: SelectQueryBuilder<Product> = 
      await this._db.getRepository(Product).createQueryBuilder("product")
    if(fromAssets){
      selectBuilder = buildQueries('product', selectBuilder, bundles,
        [AssetOperator, Product, OilAndGasAsset])
      return selectBuilder
        .innerJoin("product.assets", "oil_and_gas_asset")
        .innerJoin("oil_and_gas_asset.asset_operators", "asset_operator")
        .getCount()
    }else{
      selectBuilder = buildQueries('product', selectBuilder, bundles)
      return selectBuilder.getCount()
    }
  }

  public selectPaginated = async (
    offset: number, 
    limit: number, 
    bundles: Array<QueryBundle>,
    fromAssets?: boolean
  ): Promise<Array<ProductInterface>> => {
    let selectBuilder: SelectQueryBuilder<Product> = 
      await this._db.getRepository(Product).createQueryBuilder('product')
    if(fromAssets){
      selectBuilder = buildQueries('product', selectBuilder, bundles,
        [AssetOperator, Product, OilAndGasAsset])
      return selectBuilder
        .limit(limit)
        .offset(offset)
        .innerJoin("product.assets", "oil_and_gas_asset")
        .innerJoin("oil_and_gas_asset.asset_operators", "asset_operator")
        .orderBy('product.year', 'DESC')
        .getMany();
    }else{
      selectBuilder = buildQueries('product', selectBuilder, bundles)
      return selectBuilder
        .limit(limit)
        .offset(offset)
        .orderBy('product.year', 'DESC')
        .getMany();
    }
  }

  public getSources = async (
    bundles: Array<QueryBundle>,
    fromAssets?: boolean
  ): Promise<Array<string>> => {
    let selectBuilder: SelectQueryBuilder<Product> = 
      await this._db.getRepository(Product).createQueryBuilder("product")
    let products:ProductInterface[];
    if(fromAssets){
      selectBuilder = buildQueries('product', selectBuilder, bundles,
        [OilAndGasAsset, AssetOperator])
      products = await selectBuilder
        .select('product.source', 'source')
        .innerJoin("product.assets", "oil_and_gas_asset")
        .innerJoin("oil_and_gas_asset.asset_operators", "asset_operator")
        .distinct(true)
        .orderBy('product.source', 'ASC')
        .getRawMany()
    }else{
      selectBuilder = buildQueries('product', selectBuilder, bundles)
      products = await selectBuilder
        .select('product.source', 'source')
        .distinct(true)
        .orderBy('product.source', 'ASC')
        .getRawMany()
    }
    return Product.toRaws(products!).map(p => p.source!);
  }

  private makeProductMatchCondition = (doc: Partial<ProductInterface>) => {
    // creates an array of case insensitive queries
    const conditions: FindOptionsWhere<Product> = {}
    if (doc.name) conditions.name = ILike(doc.name)
    if (doc.type) conditions.type = ILike(doc.type)
    if (doc.amount) conditions.amount = doc.amount
    if (doc.unit) conditions.unit = ILike(doc.unit)
    if (doc.country) conditions.country = ILike(doc.country)
    //if (doc.division_type) conditions.division_type = ILike(doc.division_type)
    //if (doc.division_name) conditions.division_name = ILike(doc.division_name)
    //if (doc.sub_division_type) conditions.sub_division_type = ILike(doc.sub_division_type)
    //if (doc.sub_division_name) conditions.sub_division_name = ILike(doc.sub_division_name)
    if (doc.latitude) conditions.latitude = doc.latitude
    if (doc.longitude) conditions.longitude = doc.longitude
    if (doc.year) conditions.year = ILike(doc.year)
    if (doc.month) conditions.month = ILike(doc.month)
    if (doc.source) conditions.source = ILike(doc.source)
    return conditions
  }

}