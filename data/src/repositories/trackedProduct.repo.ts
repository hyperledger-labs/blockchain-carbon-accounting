import { DataSource } from "typeorm"
import { TrackedProduct } from "../models/trackedProduct"
import { TrackedProductPayload } from "./common"

export class TrackedProductRepo {

  private _db: DataSource

  constructor(dbConnection: DataSource) {
    this._db = dbConnection
  }

  public select = async (trackerId: number, productId: number): Promise<TrackedProduct | null> => {
    return await this._db.getRepository(TrackedProduct).findOneBy({trackerId, productId})
  }
  public insert = async (payload: TrackedProductPayload): Promise<TrackedProduct> => {
    const TrackedProductRepository = await this._db.getRepository(TrackedProduct)
    const trackedProduct = new TrackedProduct()
    return await TrackedProductRepository.save({
      ...trackedProduct,
      ...payload
    })
  }
}

