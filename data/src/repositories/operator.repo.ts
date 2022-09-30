import { OperatorDbInterface } from "@blockchain-carbon-accounting/data-common";
import type { OperatorInterface } from "@blockchain-carbon-accounting/oil-and-gas-data-lib";
import { Operator } from "../models/operator"
import { DataSource, FindOptionsWhere, ILike } from "typeorm"

export class OperatorRepo implements OperatorDbInterface {

  private _db: DataSource

  constructor(dbConnection: DataSource) {
    this._db = dbConnection
  }
  
  public putOperator = async (doc: OperatorInterface) => {
    // cleanup any existing record matching the scope/l1/../l4/text/activity_uom and year
    const repo = await this._db.getRepository(Operator)
    await repo.delete(this.makeOperatorMatchCondition(doc))
    await this._db.getRepository(Operator).save(doc)
  }

  public getOperator = async (uuid: string): Promise<Operator | null> => {
    return await this._db.getRepository(Operator).findOneBy({uuid})
  }

  public findByName = async (name: string): Promise<Operator | null> => {
    return await this._db.getRepository(Operator).findOneBy({name})
  }

  public getOperators = async (): Promise<OperatorInterface[]> => {
    return await this._db.getRepository(Operator).find()
  }

  public countOperators = async (): Promise<number> => {
    return await this._db.getRepository(Operator).count()
  }

  private makeOperatorMatchCondition = (doc: Partial<OperatorInterface>) => {
    // creates an array of case insensitive queries
    const conditions: FindOptionsWhere<Operator> = {}
    if (doc.name) conditions.name = doc.name
    return conditions
  }

}