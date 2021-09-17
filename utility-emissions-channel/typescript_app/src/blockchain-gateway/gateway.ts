import { String } from "aws-sdk/clients/codebuild";

export interface IFabricTxCaller {
  // label for certificate stored in cert store
  userId: string;

  // require if server is using vault transit
  // key to signing ledger tx
  vaultToken?: string;
}

// ##############################################################
// gateway to utilityemissionchannel
// ##############################################################
export interface IUtilityemissionchannelGateway {
  recordEmissions(
    caller: IFabricTxCaller,
    input: IUtilityemissionchannelRecordEmissionsInput
  ): Promise<IUtilityemissionchannelEmissionData>;
  getEmissionData(
    caller: IFabricTxCaller,
    uuid: string
  ): Promise<IUtilityemissionchannelEmissionData>;

  getEmissionsRecords(
    caller: IFabricTxCaller,
    input: IUtilityemissionchannelGetEMissionsRecordsInput
  ): Promise<IUtilityemissionchannelEmissionData[]>;

  getAllEmissionsDataByDateRange(
    caller: IFabricTxCaller,
    input: IUtilityemissionchannelGetAllEmissionsDataByDateRangeInput
  ): Promise<IUtilityemissionchannelEmissionData[]>;
}

export interface IUtilityemissionchannelRecordEmissionsInput {
  utilityId: string;
  partyId: string;
  fromDate: string;
  thruDate: string;
  energyUseAmount: number;
  energyUseUom: string;
  url: string;
  md5: string;
}

export interface IUtilityemissionchannelEmissionData {
  uuid: string;
  utilityId: string;
  partyId: string;
  fromDate: string;
  thruDate: string;
  emissionsAmount: number;
  renewableEnergyUseAmount: number;
  nonrenewableEnergyUseAmount: number;
  energyUseUom: string;
  factorSource: string;
  url: string;
  md5: string;
  tokenId: string;
}

export interface IUtilityemissionchannelGetEMissionsRecordsInput {
  utilityId: String;
  partyId: String;
}

export interface IUtilityemissionchannelGetAllEmissionsDataByDateRangeInput {
  fromDate: string;
  thruDate: string;
}

// ##############################################################
// gateway to fabric registry
// ##############################################################
export interface IFabricRegistryGateway {
  enroll(caller: IFabricTxCaller, secret: string): Promise<void>;
  register(
    caller: IFabricTxCaller,
    input: IFabricRegisterInput
  ): Promise<IFabricRegisterOutput>;
}

export interface IFabricRegisterInput {
  enrollmentID: string;
  affiliation: string;
}

export interface IFabricRegisterOutput {
  enrollmentID: string;
  enrollmentSecret: string;
}

// ##############################################################
// gateway to ethereum net emissions token contract
// ##############################################################
export interface IEthNetEmissionsTokenGateway {
  issue(
    caller: IEthTxCaller,
    input: IEthNetEmissionsTokenIssueInput
  ): Promise<IEthNetEmissionsTokenIssueOutput>;
}

export interface IEthTxCaller {
  address?: string;
  private?: string;
}

export interface IEthNetEmissionsTokenIssueInput {
  addressToIssue: string;
  quantity: number;
  fromDate: number;
  thruDate: number;
  automaticRetireDate: number;
  metadata: string;
  manifest: string;
  description: string;
}

export interface IEthNetEmissionsTokenIssueOutput {
  tokenId: string;
}
