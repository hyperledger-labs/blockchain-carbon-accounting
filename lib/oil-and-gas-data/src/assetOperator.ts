export const ASSET_OPERATOR_CLASS_IDENTIFIER =
    'org.hyperledger.blockchain-carbon-accounting.operator';
import { OilAndGasAssetInterface } from './oilAndGasAsset';
import { OperatorInterface } from './operator';

export interface AssetOperatorInterface extends AssetOwnerDetails {
    class: string;
    uuid: string;
    assetUuid: string;
    operatorUuid: string;
    asset: OilAndGasAssetInterface;
    operator: OperatorInterface ;
}

export interface AssetOwnerDetails {
    from_date: Date;
    thru_date?: Date;
    share: number;
}