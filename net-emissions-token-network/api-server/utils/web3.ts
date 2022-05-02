import Web3 from "web3";
import { AbiItem } from 'web3-utils';
import NetEmissionsTokenNetwork from '../../interface/packages/contracts/src/abis/NetEmissionsTokenNetwork.json';
import { OPTS_TYPE } from "../server";

export const BURN = '0x0000000000000000000000000000000000000000';

export const getWeb3 = (opts: OPTS_TYPE) => {
  const web3 = new Web3(opts.network_rpc_url);
  return web3;
}

export const getContract = (opts: OPTS_TYPE) => {
  if (opts.contract) return opts.contract;
  const web3 = getWeb3(opts);
  return new web3.eth.Contract(NetEmissionsTokenNetwork.abi as AbiItem[], opts.contract_address);
}
