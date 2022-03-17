"use strict";
/*
    SPDX-License-Identifier: Apache-2.0
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.REGIONS = exports.WEIGHT_TONS = exports.MsgFailure = exports.MsgSuccess = exports.ErrMethodNotSupported = exports.ErrInvalidArgument = exports.ErrInvalidNumberOfArgument = exports.ErrInvalidDateFormat = exports.ErrInvalidFactorForActivity = exports.ErrUnknownUOM = exports.ErrInvalidQueryString = exports.ErrStateAlreadyExists = exports.ErrStateNotFound = void 0;
// const.ts : keep all the required constants at one place
// Error Name constants
exports.ErrStateNotFound = 'STATE_NOT_FOUND';
exports.ErrStateAlreadyExists = 'STATE_ALREADY_EXISTS';
exports.ErrInvalidQueryString = 'INVALID_QUERY_STRING';
exports.ErrUnknownUOM = 'UNKNOWN_UOM';
exports.ErrInvalidFactorForActivity = 'INVALID_FACTOR_FOR_ACTIVITY';
exports.ErrInvalidDateFormat = 'INVALID_DATA_FORMAT';
// chaincode entry point errors
exports.ErrInvalidNumberOfArgument = 'INVALID_NUMBER_OF_ARGUMENT';
exports.ErrInvalidArgument = 'INVALID_ARGUMENT';
exports.ErrMethodNotSupported = 'METHOD_NOT_SUPPORTED';
// message
exports.MsgSuccess = 'METHOD_EXECUTED_SUCCESSFULLY';
exports.MsgFailure = 'METHOD_EXECUTED_FAILED';
//  weight unit
exports.WEIGHT_TONS = 'TONS';
exports.REGIONS = {
    NERC: 'nerc_region',
    // Countries
    USA: 'usa',
};
