import { ProductDbInterface } from "@blockchain-carbon-accounting/data-common";
import type { ProductInterface } from "@blockchain-carbon-accounting/oil-and-gas-data-lib";
import { Product } from "../models/product"
import { DataSource, FindOptionsWhere, ILike } from "typeorm"

export class ProductRepo implements ProductDbInterface {

  private _db: DataSource

  constructor(dbConnection: DataSource) {
    this._db = dbConnection
  }
  
  public putProduct = async (doc: ProductInterface) => {
    try{
      //const repo = await this._db.getRepository(Product)
      //await repo.delete(this.makeProductMatchCondition(doc))
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

  public countAllProducts = async (): Promise<number> => {
    return await this._db.getRepository(Product).count()
  }

  private makeProductMatchCondition = (doc: Partial<ProductInterface>) => {
    // creates an array of case insensitive queries
    const conditions: FindOptionsWhere<Product> = {}
    if (doc.name) conditions.name = ILike(doc.name)
    if (doc.type) conditions.type = ILike(doc.type)
    if (doc.amount) conditions.amount = doc.amount
    if (doc.unit) conditions.unit = ILike(doc.unit)
    if (doc.country) conditions.country = ILike(doc.country)
    if (doc.division_type) conditions.division_type = ILike(doc.division_type)
    if (doc.division_name) conditions.division_name = ILike(doc.division_name)
    if (doc.sub_division_type) conditions.sub_division_type = ILike(doc.sub_division_type)
    if (doc.sub_division_name) conditions.sub_division_name = ILike(doc.sub_division_name)
    if (doc.latitude) conditions.latitude = doc.latitude
    if (doc.longitude) conditions.longitude = doc.longitude
    if (doc.year) conditions.year = ILike(doc.year)
    if (doc.month) conditions.month = ILike(doc.month)
    if (doc.source) conditions.source = ILike(doc.source)
    return conditions
  }

}