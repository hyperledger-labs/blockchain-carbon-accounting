import { useCallback, useEffect, useState } from "react";
import { Web3Provider } from "@ethersproject/providers";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";

import { getRoles } from "../services/contract-functions";

// Enter a valid infura key here to avoid being rate limited
// You can get a key for free at https://infura.io/register
const INFURA_ID = "INVALID_INFURA_KEY";

const NETWORK_NAME = "mainnet";

function useWeb3Modal(config = {}) {
  const [provider, setProvider] = useState();
  const [signedInAddress, setSignedInAddress] = useState("");
  const [roles, setRoles] = useState([]);
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
    setProvider(new Web3Provider(newProvider));
    setSignedInAddress(newProvider.selectedAddress);
  }, [web3Modal]);

  async function fetchRoles() {
    setRoles(await getRoles(provider, signedInAddress));
  };

  const logoutOfWeb3Modal = useCallback(
    async function () {
      setSignedInAddress("");
      await web3Modal.clearCachedProvider();
      window.location.reload();
    },
    [web3Modal],
  );

  // If user has loaded a wallet before, load it automatically.
  useEffect(() => {
    if (autoLoad && web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [autoLoad, loadWeb3Modal, web3Modal.cachedProvider]);

  useEffect(() => {
    fetchRoles();
  }, [signedInAddress]);

  return [provider, loadWeb3Modal, logoutOfWeb3Modal, signedInAddress, roles];
}

export default useWeb3Modal;
