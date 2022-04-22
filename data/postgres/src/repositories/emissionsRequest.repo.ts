import { DataSource } from "typeorm"
import { EmissionsRequest } from "../models/emissionsRequest"
import { type EmissionsRequestPayload } from "./common"

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

  public selectByEmissionAuditor = async (emissionAuditor: string): Promise<Array<EmissionsRequest>> => {
    const status = 'PENDING';
    try {
      return await this._db.getRepository(EmissionsRequest)
        .createQueryBuilder('emissions_request')
        .where("LOWER(emissions_request.emission_auditor) = LOWER(:emissionAuditor)", {emissionAuditor})
        .andWhere("emissions_request.status = :status", {status})
        .getMany()
    } catch (error) {
      throw new Error('cannot select auditor emissions requests')
    }
  }

  public countByEmissionAuditor = async (emissionAuditor: string): Promise<number> => {
    const status = 'PENDING';
    try {
      return await this._db.getRepository(EmissionsRequest)
        .createQueryBuilder('emissions_request')
        .where("LOWER(emissions_request.emission_auditor) = LOWER(:emissionAuditor)", {emissionAuditor})
        .andWhere("emissions_request.status = :status", {status})
        .getCount()
    } catch (error) {
      throw new Error('cannot count auditor emissions requests')
    }
  }

  public updateToPending = async (
      uuid: string,
      emissionAuditor: string,
      inputDataIpfsHash: string,
      publicKey: string,
      publicKeyName: string | undefined,
      tokenManifest: string
    ) => {
    const status = 'PENDING';
    try {
      await this._db.getRepository(EmissionsRequest)
      .createQueryBuilder('emissions_request')
      .update(EmissionsRequest)
      .set({
        emission_auditor: () =>  `'${emissionAuditor}'`,
        input_data_ipfs_hash: () => `'${inputDataIpfsHash}'`,
        public_key: () => `'${publicKey}'`,
        public_key_name: () => `'${publicKeyName}'`,
        token_manifest: () => `'${tokenManifest}'`,
        status: () => `'${status}'`
      })
      .where("uuid = :uuid", {uuid: uuid})
      .execute()
    } catch (error) {
      console.log(error);
      throw new Error(`Cannot update emissions request ${uuid} status to ${status}`)
    }
  }

  public updateStatus = async (uuid: string, status: string) => {
    try {
      await this._db.getRepository(EmissionsRequest)
      .createQueryBuilder('emissions_request')
      .update(EmissionsRequest)
      .set({
        status: () => `'${status}'`
      })
      .where("uuid = :uuid", {uuid: uuid})
      .execute()
    } catch (error) {
      console.log(error);
      throw new Error(`Cannot update emissions request ${uuid} status to ${status}`)
    }
  }

  public updateToDeclined = async (uuid: string) => {
    await this.updateStatus(uuid, 'DECLINED')
  }

  public updateToIssued = async (uuid: string) => {
    await this.updateStatus(uuid, 'ISSUED')
  }

  public selectEmissionsRequest = async (uuid: string): Promise<EmissionsRequest | null> => {
    return await this._db.getRepository(EmissionsRequest).findOneBy({uuid})
  }
}
