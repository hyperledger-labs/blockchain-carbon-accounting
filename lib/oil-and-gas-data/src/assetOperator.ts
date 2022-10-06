export const ASSET_OPERATOR_CLASS_IDENTIFIER =
    'org.hyperledger.blockchain-carbon-accounting.operator';
import { OilAndGasAsset, Operator } from '@blockchain-carbon-accounting/data-postgres';

export interface AssetOperatorInterface extends AssetOwnerDetails {
    uuid: string;
    assetUuid: string;
    operatorUuid: string;
    class: string;
    asset: OilAndGasAsset;
    operator: Operator ;
}

export interface AssetOwnerDetails {
    from_date: Date;
    thru_date?: Date;
    share: number;
}