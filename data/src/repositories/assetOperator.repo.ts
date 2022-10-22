import { AssetOperatorDbInterface } from "@blockchain-carbon-accounting/data-common";
import type { AssetOperatorInterface } from "@blockchain-carbon-accounting/oil-and-gas-data-lib";
import { OilAndGasAsset } from "../models/oilAndGasAsset"
import { AssetOperator } from "../models/assetOperator"
import { Operator } from "../models/operator"
import { DataSource, SelectQueryBuilder} from "typeorm"



import { buildQueries, QueryBundle } from "./common"

export class AssetOperatorRepo implements AssetOperatorDbInterface{

  private _db: DataSource

  constructor(dbConnection: DataSource) {
    this._db = dbConnection
  }
  
  public putAssetOperator = async (doc: AssetOperatorInterface) => {
    try{
      const repo = this._db.getRepository(AssetOperator)  
      await repo.save(doc)
      //increment asset_count of operator is newOperator saved
      if(doc.operator.asset_count){doc.operator.asset_count += 1}
      await this._db.getRepository(Operator).save(doc.operator)
    }catch(error){
      throw new Error(`Cannot create asset_operator relation:: ${error}`)       
    }
  }

  public getAssetOperators = async (): Promise<AssetOperator[]> => {
    return await this._db.getRepository(AssetOperator).find()
  }

  public countAssetOwners = async (): Promise<number> => {
    return await this._db.getRepository(AssetOperator).count()
  }

  public selectAssetsPaginated = async (
    offset: number, 
    limit: number, 
    bundles: Array<QueryBundle>
  ): Promise<Array<OilAndGasAsset>> => {
    let selectBuilder: SelectQueryBuilder<AssetOperator> 
      = await this._db.getRepository(AssetOperator).createQueryBuilder("asset_operator")
    // category by issuer address
    selectBuilder = buildQueries('asset_operator', selectBuilder, bundles)
    return selectBuilder
      .innerJoinAndSelect(
        "asset_operator.assets",
        "assets"
      )
      .limit(limit)
      .offset(offset)
      //.orderBy('asset_operators.operator', 'ASC')
      .getRawMany();
  }

  public countAssets = async (
    bundles: Array<QueryBundle>
  ): Promise<number> => {
    let selectBuilder: SelectQueryBuilder<AssetOperator> 
      = await this._db.getRepository(AssetOperator).createQueryBuilder("asset_operator")
    // category by issuer address
    selectBuilder = buildQueries('asset_operator', selectBuilder, bundles)
    return selectBuilder
      .innerJoinAndSelect(
        "asset_operator.assets",
        "assets"
      )
      .select('oil_and_gas_asset.operator')
      .getCount()
  }

  public selectProductsPaginated = async (
    offset: number, 
    limit: number, 
    bundles: Array<QueryBundle>
  ): Promise<Array<OilAndGasAsset>> => {
    let selectBuilder: SelectQueryBuilder<AssetOperator> 
      = await this._db.getRepository(AssetOperator).createQueryBuilder("asset_operator")
    // category by issuer address
    selectBuilder = buildQueries('asset_operator', selectBuilder, bundles)
    return selectBuilder
      .innerJoinAndSelect(
        "asset_operator.assets",
        "assets"
      )
      .limit(limit)
      .offset(offset)
      //.orderBy('asset_operators.operator', 'ASC')
      .getRawMany();
  }

  public countProducts = async (
    bundles: Array<QueryBundle>
  ): Promise<number> => {
    let selectBuilder: SelectQueryBuilder<AssetOperator> 
      = await this._db.getRepository(AssetOperator).createQueryBuilder("asset_operator")
    // category by issuer address
    selectBuilder = buildQueries('asset_operator', selectBuilder, bundles)
    return selectBuilder
      .innerJoinAndSelect(
        "asset_operator.assets",
        "assets"
      )
      .select('oil_and_gas_asset.operator')
      .getCount()
  }
}