import erc20Abi from "./abis/erc20.json";
import ownableAbi from "./abis/ownable.json";
import greeterAbi from "./abis/Greeter.json";
import netEmissionsTokenNetworkAbi from "./abis/NetEmissionsTokenNetwork.json";

const abis = {
  erc20: erc20Abi,
  ownable: ownableAbi,
  greeter: greeterAbi,
  netEmissionsTokenNetwork: netEmissionsTokenNetworkAbi
};

export default abis;
