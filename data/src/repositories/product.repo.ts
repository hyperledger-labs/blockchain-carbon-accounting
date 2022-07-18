import { ProductDbInterface } from "@blockchain-carbon-accounting/data-common/db";
import type { ProductInterface } from "@blockchain-carbon-accounting/oil-and-gas-data-lib/src/product";
//import { OIL_AND_GAS_PRODUCT_CLASS_IDENTIFER } from "@blockchain-carbon-accounting/oil-and-gas-data-lib/src/product;
import { DataSource } from "typeorm"
import { Product } from "../models/product"

export class ProductRepo implements ProductDbInterface {

  private _db: DataSource

  constructor(dbConnection: DataSource) {
    this._db = dbConnection
  }
  
  public putProduct = async (doc: ProductInterface) => {
    // cleanup any existing record matching the scope/l1/../l4/text/activity_uom and year
    const repo = this._db.getRepository(Product)
    await repo.save(doc)
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

}