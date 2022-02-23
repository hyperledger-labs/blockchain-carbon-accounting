import { ValueAndUnit } from './common-types';
import BCGatewayConfig from '../../utility-emissions-channel/typescript_app/src/blockchain-gateway/config';
import Signer from '../../utility-emissions-channel/typescript_app/src/blockchain-gateway/signer';
import EthNetEmissionsTokenGateway from '../../utility-emissions-channel/typescript_app/src/blockchain-gateway/netEmissionsTokenNetwork';
import {
    IEthTxCaller,
    IEthNetEmissionsTokenIssueInput,
} from '../../utility-emissions-channel/typescript_app/src/blockchain-gateway/I-gateway';
import { setup } from '../../utility-emissions-channel/typescript_app/src/utils/logger';
import { BigNumber } from 'bignumber.js';


let logger_setup = false;
const LOG_LEVEL = 'silent';

export function calc_ground_emissions(weight: number): ValueAndUnit {
  const emissions = weight * 0.001 * 0.52218;
  return { value: emissions, unit: 'kgCO2e' };
}

export function calc_flight_emissions(weight: number): ValueAndUnit {
  const emissions = weight * 0.001 * 2.37968;
  return { value: emissions, unit: 'kgCO2e' };
}

export async function issue_emissions_tokens(total_emissions: number, hash: string, ipfs_path: string) {
  if (!logger_setup) {
    setup(LOG_LEVEL, LOG_LEVEL);
    logger_setup = true;
  }
  const tokens = new BigNumber(Math.round(total_emissions));
  const total_emissions_rounded = Math.round(total_emissions*1000)/1000;
  const bcConfig = new BCGatewayConfig();
  const ethConnector = await bcConfig.ethConnector();
  const signer = new Signer('vault', bcConfig.inMemoryKeychainID, 'plain');
  const nowTime = Math.floor(new Date().getTime() / 1000);

  const gateway = new EthNetEmissionsTokenGateway({
    contractStoreKeychain: ethConnector.contractStoreKeychain,
    ethClient: ethConnector.connector,
    signer: signer,
  });
  const caller: IEthTxCaller = {
    address: process.env.ETH_ISSUER_ACCT,
    private: process.env.ETH_ISSUER_PRIVATE_KEY,
  };
  const input: IEthNetEmissionsTokenIssueInput = {
    addressToIssue: process.env.ETH_ISSUEE_ACCT || '',
    quantity: tokens.toNumber(),
    fromDate: nowTime,
    thruDate: nowTime,
    automaticRetireDate: 0,
    manifest: `ipfs://${ipfs_path} ${hash}`,
    metadata: `Total emissions: ${total_emissions_rounded} UOM: kgCO2e Scope: 3 Type: Shipping`,
    description: 'Emissions from shipments',
  };
  const token = await gateway.issue(caller, input);
  return token;
}
