import { Distance, ValueAndUnit } from './common-types';
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

export function weight_in_kg(weight: number, uom?: string) {
  if (!weight) throw new Error(`Invalid weight ${weight}`);
  if (!uom) return weight;
  // check supported UOMs
  const u = uom.toLowerCase();
  if (u === 'kg') return weight;
  if (u === 'lb'||u === 'lbs'||u === 'pound') return weight * 0.453592;
  if (u === 'pound') return weight * 0.453592;
  if (u === 't') return weight * 1000.0;
  if (u === 'g') return weight / 1000.0;
  // not recognized
  throw new Error(`Weight UOM ${uom} not supported`);
}

export function distance_in_km(distance: Distance): number {
  if (!distance.unit||distance.unit === 'km') return distance.value;
  if (distance.unit === 'mi') return distance.value * 1.60934;
  // not recognized
  throw new Error(`Distance UOM ${distance.unit} not supported`);
}

export function calc_ground_emissions(weight_kg: number, distance: Distance): ValueAndUnit {
  const distance_km = distance_in_km(distance);
  const emissions = weight_kg * 0.001 * 0.52218 * distance_km;
  return { value: emissions, unit: 'kgCO2e' };
}

export function calc_flight_emissions(weight_kg: number, distance: Distance): ValueAndUnit {
  const distance_km = distance_in_km(distance);
  const emissions = weight_kg * 0.001 * 2.37968 * distance_km;
  return { value: emissions, unit: 'kgCO2e' };
}

export function calc_emissions(weight_kg: number, distance: Distance): ValueAndUnit {
  const distance_km = distance_in_km(distance);
  const w_d = weight_kg * 0.001 * distance_km;
  // for difference 'mode'
  let emissions = w_d;
  if (distance.mode === 'air') {
    emissions *= 2.37968;
  } else if (distance.mode === 'ground') {
    emissions *= 0.52218;
  } else {
    throw new Error(`Distance mode ${distance.mode} not supported`);
  }
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
