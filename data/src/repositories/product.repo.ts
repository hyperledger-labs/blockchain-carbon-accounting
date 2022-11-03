import { ProductDbInterface } from "@blockchain-carbon-accounting/data-common";
import type { ProductInterface } from "@blockchain-carbon-accounting/oil-and-gas-data-lib";
import { DataSource, SelectQueryBuilder, FindOptionsWhere, ILike, Brackets } from "typeorm"
import hash from 'object-hash';

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
      //const product = await repo.findOneBy(this.makeProductMatchCondition(doc))
      //await repo.delete(this.makeProductMatchCondition(doc))
      // merge exsiting product with new doc...
      //await repo.save({...product,...doc,...{uuid: product!.uuid}})
      await repo.save(doc)

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
        .innerJoinAndSelect("product.assets", "oil_and_gas_asset")
        .innerJoin("oil_and_gas_asset.asset_operators", "asset_operator")
        // limit product lists to emissions and production
        .andWhere(new Brackets(query => {
          query.where("product.type = 'emissions'")
          .orWhere("product.type = 'production'")
        }))
        .orderBy('product.year', 'DESC')
        .getMany();
    }else{
      selectBuilder = buildQueries('product', selectBuilder, bundles)
      return selectBuilder
        .limit(limit)
        .offset(offset)
        // limit product lists to emissions and production
        .andWhere(new Brackets(query => {
          query.where("product.type = 'emissions'")
          .orWhere("product.type = 'production'")
        }))
        .orderBy('product.year', 'DESC')
        .getMany();
    }
  }

  public getTotals = async (
    offset: number, 
    limit: number, 
    bundles: Array<QueryBundle>,
    fromAssets?: boolean
  ): Promise<ProductInterface[]> => {
    
    const products:ProductInterface[] = await this.selectPaginated(0,0,bundles,fromAssets);

    /*const names = [...new Set(products.map(p => p.name))];
    const years = [...new Set(products.map(p => p.year))];
    const countries = [...new Set(products.map(p => p.country))];
    const units = [...new Set(products.map(p => p.unit))];*/

    const totals:ProductInterface[]=[];
    const totalsIndex:{[key: string]: number}={"0":-1};
    let index;
    for (const product of products){
      const totalsObject = {
          class: product.class.toLowerCase(), 
          type: product.type, 
          name: product.name.toLowerCase(), 
          unit: product.unit?.toLowerCase(),
          country: product.country?.toLowerCase(), 
          year: product.year?.toLowerCase(),
          //month: product.month?.toLowerCase(), 
          source: product.source?.toLowerCase()
      }
      const totalskey = hash(JSON.stringify(totalsObject))
      //console.log(totalskey, totalskey in totalsIndex)
      if(!(totalskey in totalsIndex)){
        totalsIndex[totalskey] = totals.length;
        totals.push({...totalsObject, ...{
          uuid: '',
          amount: 0, 
          from_date: product.from_date!, 
          thru_date: product.thru_date!}
        });
      }
      index = totalsIndex[totalskey];
      totals[index]['amount'] += product.amount
      if(product.thru_date! > totals[index]['thru_date']!){
        totals[index]['thru_date']=product.thru_date!
      }
      if(product.from_date! < totals[index]['from_date']!){
        totals[index]['from_date']=product.from_date!
      }
    }
    return totals;
  }

  public getDistinctAttributes = async (
    bundles: Array<QueryBundle>,
    field: string,
    fromAssets?: boolean
  ): Promise<Array<string>> => {

    type ProductFields = 'year'|'name'|'unit'|'country'|'source';
    const product_field = field as ProductFields

    let selectBuilder: SelectQueryBuilder<Product> = 
      await this._db.getRepository(Product).createQueryBuilder("product")
    let products:ProductInterface[];

    if(fromAssets){
      selectBuilder = buildQueries('product', selectBuilder, bundles,
        [Product, OilAndGasAsset, AssetOperator])
      products = await selectBuilder
        .select(`product.${field}`, `${field}`)
        .innerJoin("product.assets", "oil_and_gas_asset")
        .innerJoin("oil_and_gas_asset.asset_operators", "asset_operator")
        .distinct(true)
        .orderBy(`product.${field}`, 'ASC')
        .getRawMany()
    }else{
      selectBuilder = buildQueries('product', selectBuilder, bundles)
      products = await selectBuilder
        .select(`product.${field}`, `${field}`)
        .distinct(true)
        .orderBy(`${field}`, 'ASC')
        .getRawMany()
    }

    return Product.toRaws(products).map(p => p[`${product_field}`]!);
  }

  private makeProductMatchCondition = (doc: Partial<ProductInterface>) => {
    // creates an array of case insensitive queries
    const conditions: FindOptionsWhere<Product> = {}
    if (doc.name) conditions.name = ILike(doc.name)
    //if (doc.type) conditions.type = doc.type
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