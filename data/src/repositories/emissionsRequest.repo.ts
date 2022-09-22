import { DataSource } from "typeorm"
import { EmissionsRequest, EmissionsRequestSupportingDocument } from "../models/emissionsRequest"
import { UploadedFile } from "../models/uploadedFile"
import { type EmissionsRequestPayload } from "./common"

export class EmissionsRequestRepo {

  private _db: DataSource

  constructor(dbConnection: DataSource) {
    this._db = dbConnection
  }

  public insert = async (payload: EmissionsRequestPayload): Promise<EmissionsRequest> => {
    const repository = await this._db.getRepository(EmissionsRequest)
    const emissionsRequest = new EmissionsRequest()
    return await repository.save({
      ...emissionsRequest,
      ...payload
    })
  }

  public async getERQueryBuilder(includeSensitiveFields = false) {
    const q = await this._db.getRepository(EmissionsRequest).createQueryBuilder('emissions_request')
    if (includeSensitiveFields) {
      return q.addSelect('emissions_request.input_content')
    }
    return q
  }

  public selectAll = async (includeSensitiveFields = false): Promise<Array<EmissionsRequest>> => {
    return (await this.getERQueryBuilder(includeSensitiveFields)).getMany()
  }

  public selectPending = async (includeSensitiveFields = false): Promise<Array<EmissionsRequest>> => {
    return await this.selectByStatus('PENDING', includeSensitiveFields)
  }

  public selectCreated = async (includeSensitiveFields = false): Promise<Array<EmissionsRequest>> => {
    return await this.selectByStatus('CREATED', includeSensitiveFields)
  }

  public selectByStatus = async (status: string, includeSensitiveFields = false): Promise<Array<EmissionsRequest>> => {
    try {
      return (await this.getERQueryBuilder(includeSensitiveFields))
        .where("emissions_request.status = :status", {status})
        .getMany()
    } catch (error) {
      throw new Error('cannot select pending emissions requests')
    }
  }

  public selectByEmissionAuditor = async (emissionAuditor: string, includeSensitiveFields = false): Promise<Array<EmissionsRequest>> => {
    const status = 'PENDING';
    try {
      return (await this.getERQueryBuilder(includeSensitiveFields))
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

  public selectEmissionsRequest = async (uuid: string, includeSensitiveFields = false): Promise<EmissionsRequest | null> => {
    return (await this.getERQueryBuilder(includeSensitiveFields))
      .where({uuid})
      .getOne()
  }

  public selectSupportingDocuments = async (emissions_request: EmissionsRequest) => {
    return await this._db.getRepository(EmissionsRequestSupportingDocument)
      .createQueryBuilder("doc")
      .leftJoinAndSelect("doc.file", "uploaded_file")
      .where({emissions_request})
      .getMany()
  }
  public addSupportingDocument = async (emissions_request: EmissionsRequest, file: UploadedFile) => {
    const repo = await this._db.getRepository(EmissionsRequestSupportingDocument)
    const supporting_doc = repo
      .create({
      file,
      emissions_request
    })
    return await repo.save(supporting_doc)
  }
}
