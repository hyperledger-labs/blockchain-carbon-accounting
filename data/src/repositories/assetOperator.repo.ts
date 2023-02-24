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
  
  public findByPrimaryColumns = async (assetUuid: string, operatorUuid: string): Promise<AssetOperatorInterface | null> => {
    return await this._db.getRepository(AssetOperator)
      .findOneBy({assetUuid,operatorUuid})
  }
  public putAssetOperator = async (doc: AssetOperatorInterface) => {
    try{
      const repo = this._db.getRepository(AssetOperator) 
      const assetOperator = await this.findByPrimaryColumns(doc.assetUuid,doc.operatorUuid) 
      //increment asset_count of operator if unique assetOperator has not been created yet
      if(!assetOperator){
        if(!doc.operator.asset_count){doc.operator.asset_count=0}
        doc.operator.asset_count += 1
        await this._db.getRepository(Operator).save(doc.operator)
      }else{
        doc.uuid=assetOperator.uuid
      }
      await repo.save(doc)
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

  public select = async (
    bundles: Array<QueryBundle>,
  ): Promise<Array<AssetOperatorInterface>> => {
    let selectBuilder: SelectQueryBuilder<AssetOperator> = await this._db.getRepository(AssetOperator).createQueryBuilder("asset_operator")
    // category by issuer address
    selectBuilder = buildQueries('asset_operator', selectBuilder, bundles 
        ,[AssetOperator,OilAndGasAsset])
    return selectBuilder    
      .innerJoin("asset_operator.asset", "oil_and_gas_asset")
      .getMany();
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