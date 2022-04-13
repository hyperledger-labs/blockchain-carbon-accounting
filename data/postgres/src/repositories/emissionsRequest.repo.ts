import { DataSource } from "typeorm"
import { EmissionsRequest } from "../models/emissionsRequest"
import { EmissionsRequestPayload } from "./common"

export class EmissionsRequestRepo {

  private _db: DataSource

  constructor(dbConnection: DataSource) {
    this._db = dbConnection
  }

  public insert = async (payload: EmissionsRequestPayload): Promise<EmissionsRequest> => {
    const repository = this._db.getRepository(EmissionsRequest)
    const emissionsRequest = new EmissionsRequest()
    return await repository.save({
      ...emissionsRequest,
      ...payload
    })
  }

  public selectAll = async (): Promise<Array<EmissionsRequest>> => {
    return await this._db.getRepository(EmissionsRequest).find()
  }

  public selectPending = async (): Promise<Array<EmissionsRequest>> => {
    return await this.selectByStatus('PENDING')
  }

  public selectCreated = async (): Promise<Array<EmissionsRequest>> => {
    return await this.selectByStatus('CREATED')
  }

  public selectByStatus = async (status: string): Promise<Array<EmissionsRequest>> => {
    try {
      return await this._db.getRepository(EmissionsRequest)
        .createQueryBuilder('emissions_request')
        .where("emissions_request.status = :status", {status})
        .getMany()
    } catch (error) {
      throw new Error('cannot select pending emissions requests')
    }
  }
}
