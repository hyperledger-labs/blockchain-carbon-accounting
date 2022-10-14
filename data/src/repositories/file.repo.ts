import { DataSource } from "typeorm"
import { UploadedFile } from "../models/uploadedFile"

export class FileRepo {

  private _db: DataSource

  constructor(dbConnection: DataSource) {
    this._db = dbConnection
  }

  public insert = async (payload: Omit<UploadedFile, 'uuid' | 'created_at' | 'updated_at' | 'toJSON'>): Promise<UploadedFile> => {
    const repository = await this._db.getRepository(UploadedFile)
    const file = new UploadedFile()
    return await repository.save({
      ...file,
      ...payload
    })
  }
}
