export const OPERATOR_CLASS_IDENTIFIER =
    'org.hyperledger.blockchain-carbon-accounting.operator';
import { AssetOwner, Wallet } from '@blockchain-carbon-accounting/data-postgres';

export interface OperatorInterface extends OperatorDetails {
    uuid: string;
    class: string;
    wallet: Wallet;
    assets?: AssetOwner[];
}

export interface OperatorDetails {
    name: string;
    status?: string;
    description?: string;
}