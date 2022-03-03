// SPDX-License-Identifier: Apache-2.0
import { useCallback, useEffect, useState } from "react";
import { Web3Provider } from "@ethersproject/providers";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";

import { getRoles, getRegisteredTracker, getLimitedMode } from "../services/contract-functions";

// Enter a valid infura key here to avoid being rate limited
// You can get a key for free at https://infura.io/register
const INFURA_ID = "INVALID_INFURA_KEY";

const NETWORK_NAME = "mainnet";

function useWeb3Modal(config = {}) {
  const [provider, setProvider] = useState();
  const [autoLoaded, setAutoLoaded] = useState(false);
  const [signedInAddress, setSignedInAddress] = useState("");
  const [roles, setRoles] = useState([]);
  const [registeredTracker, setRegisteredTracker] = useState([]);
  const [limitedMode, setLimitedMode] = useState(null);
  const { autoLoad = true, infuraId = INFURA_ID, NETWORK = NETWORK_NAME } = config;

  // Web3Modal also supports many other wallets.
  // You can see other options at https://github.com/Web3Modal/web3modal
  const web3Modal = new Web3Modal({
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
  });


  // Open wallet selection modal.
  const loadWeb3Modal = useCallback(async () => {
    const newProvider = await web3Modal.connect();
    newProvider.on("accountsChanged", (accounts) => {
      setSignedInAddress(accounts[0]||'');
    });

    const web3Provider = new Web3Provider(newProvider);
    setProvider(web3Provider);
    setSignedInAddress(newProvider.selectedAddress);
  }, [web3Modal]);

  const logoutOfWeb3Modal = useCallback(
    async function () {
      setSignedInAddress("");
      await web3Modal.clearCachedProvider();
      window.location.reload();
    },
    [web3Modal],
  );

  // If autoLoad is enabled and the the wallet had been loaded before, load it automatically now.
  useEffect(() => {
    if (autoLoad && !autoLoaded && web3Modal.cachedProvider) {
      loadWeb3Modal();
      setAutoLoaded(true);
    }
  }, [autoLoad, autoLoaded, loadWeb3Modal, setAutoLoaded, web3Modal.cachedProvider]);

  useEffect(() => {

    async function fetchRoles() {
      setRoles(await getRoles(provider, signedInAddress));
    };
    async function fetchRegisteredTracker() {
      setRegisteredTracker(await getRegisteredTracker(provider, signedInAddress));
    };
    async function fetchLimitedMode() {
      setLimitedMode(await getLimitedMode(provider));
    }

    fetchRoles();
    fetchRegisteredTracker();
    fetchLimitedMode();

  }, [provider, signedInAddress]);

  return [provider, loadWeb3Modal, logoutOfWeb3Modal, signedInAddress, roles, registeredTracker, limitedMode];
}

export default useWeb3Modal;
