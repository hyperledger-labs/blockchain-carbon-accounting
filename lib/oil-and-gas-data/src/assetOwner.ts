export const ASSET_OWNER_CLASS_IDENTIFIER =
    'org.hyperledger.blockchain-carbon-accounting.operator';
import { OilAndGasAsset, Operator } from '@blockchain-carbon-accounting/data-postgres';

export interface AssetOwnerInterface extends AssetOwnerDetails {
    uuid: string;
    class: string;
    asset: OilAndGasAsset;
    operator: Operator ;
}

export interface AssetOwnerDetails {
    from_date: Date;
    thru_date?: Date;
    share: number;
}