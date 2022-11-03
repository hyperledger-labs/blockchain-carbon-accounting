import Web3 from "web3";
import { AbiItem } from 'web3-utils';
import NetEmissionsTokenNetwork from '@blockchain-carbon-accounting/contracts/src/abis/NetEmissionsTokenNetwork.json';
import CarbonTracker from '@blockchain-carbon-accounting/contracts/src/abis/CarbonTracker.json';
import { OPTS_TYPE } from "../server";

export const BURN = '0x0000000000000000000000000000000000000000';



export const getWeb3 = (opts: OPTS_TYPE) => {
  let url = opts.network_rpc_url;
  if (opts.use_web_socket) {
    if (opts.network_ws_url) {
      url = opts.network_ws_url
    } else if (url.startsWith('http:')) {
      url = url.replace('http:', 'ws:');
    } else if (url.startsWith('https:')) {
      url = url.replace('https:', 'wss:');
    }
  }
  const web3 = new Web3(url);
  return web3;
}

export const getContract = (opts: OPTS_TYPE):any => {
  if (opts.contract) return opts.contract;
  const web3 = getWeb3(opts);
  return new web3.eth.Contract(NetEmissionsTokenNetwork.abi as AbiItem[], opts.contract_address);
}

export const getTrackerContract = (opts: OPTS_TYPE):any  => {
  if (opts.trackerContract) return opts.trackerContract;
  const web3 = getWeb3(opts);
  return new web3.eth.Contract(CarbonTracker.abi as AbiItem[], opts.tracker_address);
}

export const getCurrentBlock = async (opts: OPTS_TYPE) => {
  const web3 = getWeb3(opts);
  return web3.eth.getBlockNumber();
}
