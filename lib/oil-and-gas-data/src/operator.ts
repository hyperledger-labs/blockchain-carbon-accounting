export const OPERATOR_CLASS_IDENTIFIER =
    'org.hyperledger.blockchain-carbon-accounting.operator';
import { ProductInterface } from './product';
import { OilAndGasAssetInterface } from './oilAndGasAsset';
import { AssetOperatorInterface } from './assetOperator';

export interface OperatorInterface extends OperatorDetails {
    uuid: string;
    class: string;
    wallet_address: string;
    assetOperators?: AssetOperatorInterface[];
    assets?: OilAndGasAssetInterface[];
    products?: ProductInterface[];
}

export interface OperatorDetails {
    name: string;
    status?: string;
    description?: string;
    asset_count?: number;
}