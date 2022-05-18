// SPDX-License-Identifier: Apache-2.0
import { useCallback, useEffect, useState, useMemo } from "react";
import { Web3Provider, JsonRpcProvider } from "@ethersproject/providers";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";

import { getRoles, getRegisteredTracker, getLimitedMode } from "../services/contract-functions";
import { RolesInfo, Wallet } from "../components/static-data";
import { RPC_URL } from "../services/api.config";

// Enter a valid infura key here to avoid being rate limited
// You can get a key for free at https://infura.io/register
const INFURA_ID = "INVALID_INFURA_KEY";

const NETWORK_NAME = "mainnet";

function useWeb3Modal(config: any = {}) {
  const [provider, setProvider] = useState<Web3Provider|JsonRpcProvider>();
  const [autoLoaded, setAutoLoaded] = useState(false);
  const [signedInAddress, setSignedInAddress] = useState("");
  const [signedInWallet, setSignedInWallet] = useState<Wallet | undefined>();
  const [roles, setRoles] = useState<RolesInfo>({});
  const [registeredTracker, setRegisteredTracker] = useState(false);
  const [limitedMode, setLimitedMode] = useState(true);
  const { autoLoad = true, infuraId = INFURA_ID, NETWORK = NETWORK_NAME } = config;

  // Web3Modal also supports many other wallets.
  // You can see other options at https://github.com/Web3Modal/web3modal
  const web3Modal = useMemo(() => new Web3Modal({
    network: NETWORK,
    cacheProvider: true,
    providerOptions: {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          infuraId,
        },
      },
    },
  }), [NETWORK, infuraId]);

  // Open wallet selection modal.
  const loadWeb3Modal = useCallback(async () => {
    const newProvider = await web3Modal.connect();
    newProvider.on("accountsChanged", (accounts: string[]) => {
      setSignedInAddress(accounts[0]||'');
    });

    const web3Provider = new Web3Provider(newProvider);
    setProvider(web3Provider);
    setSignedInAddress(newProvider.selectedAddress);
  }, [web3Modal]);

  const logoutOfWeb3Modal = useCallback(
    async function () {
      setSignedInAddress("");
      web3Modal.clearCachedProvider();
      window.location.reload();
    },
    [web3Modal],
  );

  const loadWalletInfo = (wallet:Wallet) => {
    const web3Provider = new JsonRpcProvider(RPC_URL);
    setProvider(web3Provider);
    setSignedInWallet(wallet);
    setSignedInAddress(wallet.address||'');
  }

  const logoutOfWalletInfo = () => {
    setSignedInAddress("");
    setSignedInWallet(undefined);
  }

  const refresh = useCallback(async () => {
    async function fetchRoles(provider: Web3Provider | JsonRpcProvider) {
      setRoles(await getRoles(provider, signedInAddress));
    };
    async function fetchRegisteredTracker(provider: Web3Provider | JsonRpcProvider) {
      setRegisteredTracker(await getRegisteredTracker(provider, signedInAddress));
    };
    async function fetchLimitedMode(provider: Web3Provider | JsonRpcProvider) {
      setLimitedMode(await getLimitedMode(provider));
    }

    if (provider) {
      fetchRoles(provider);
      fetchRegisteredTracker(provider);
      fetchLimitedMode(provider);
    }
  }, [provider, signedInAddress]);

  // If autoLoad is enabled and the the wallet had been loaded before, load it automatically now.
  useEffect(() => {
    if (autoLoad && !autoLoaded && web3Modal.cachedProvider) {
      loadWeb3Modal();
      setAutoLoaded(true);
    }
  }, [autoLoad, autoLoaded, loadWeb3Modal, setAutoLoaded, web3Modal.cachedProvider]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {provider, loadWeb3Modal, logoutOfWeb3Modal, loadWalletInfo, logoutOfWalletInfo, signedInAddress, signedInWallet, roles, registeredTracker, limitedMode, refresh};
}

export default useWeb3Modal;
