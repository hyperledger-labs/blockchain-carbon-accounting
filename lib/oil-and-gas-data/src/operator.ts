export const OPERATOR_CLASS_IDENTIFIER =
    'org.hyperledger.blockchain-carbon-accounting.operator';
import { AssetOperator, Wallet, Product, OilAndGasAsset } from '@blockchain-carbon-accounting/data-postgres';

export interface OperatorInterface extends OperatorDetails {
    uuid: string;
    class: string;
    //wallet: Wallet;
    wallet_address: string;
    assetOperators?: AssetOperator[];
    assets?: OilAndGasAsset[];
    products?: Product[];
}

export interface OperatorDetails {
    name: string;
    status?: string;
    description?: string;
    asset_count?: number;

}