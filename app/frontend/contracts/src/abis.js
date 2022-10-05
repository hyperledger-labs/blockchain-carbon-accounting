"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// SPDX-License-Identifier: Apache-2.0
const NetEmissionsTokenNetwork_json_1 = __importDefault(require("./abis/NetEmissionsTokenNetwork.json"));
const CarbonTracker_json_1 = __importDefault(require("./abis/CarbonTracker.json"));
const DAOToken_json_1 = __importDefault(require("./abis/DAOToken.json"));
const Governor_json_1 = __importDefault(require("./abis/Governor.json"));
const abis = {
    netEmissionsTokenNetwork: NetEmissionsTokenNetwork_json_1.default,
    carbonTracker: CarbonTracker_json_1.default,
    daoToken: DAOToken_json_1.default,
    governor: Governor_json_1.default
};
exports.default = abis;
//# sourceMappingURL=abis.js.map