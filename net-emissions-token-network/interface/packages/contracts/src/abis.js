// SPDX-License-Identifier: Apache-2.0
import netEmissionsTokenNetworkAbi from "./abis/NetEmissionsTokenNetwork.json";
import carbonTrackerAbi from "./abis/CarbonTracker.json";
import daoTokenAbi from "./abis/DAOToken.json";
import governorAbi from "./abis/Governor.json";

const abis = {
  netEmissionsTokenNetwork: netEmissionsTokenNetworkAbi,
  carbonTracker: carbonTrackerAbi,
  daoToken: daoTokenAbi,
  governor: governorAbi
};

export default abis;
