/*
    SPDX-License-Identifier: Apache-2.0
*/

import { ChaincodeStub, Iterators } from 'fabric-shim';
import { State } from './state';
import { ErrStateNotFound, ErrInvalidQueryString } from './const';

/**
 * WorldState class is a wrapper around chaincode stub
 * for managing lifecycle of a asset of type T (interface) on HL fabric
 * provided methods
 * - addState
 * - getState
 * - query
 * - getAssetFromIterator
 */
export abstract class WorldState<T> extends State {
  constructor(protected stub: ChaincodeStub) {
    // keys are not used for the WorldState class
    super([]);
  }

  protected async addState(id: string, asset: T): Promise<void> {
    return this.stub.putState(id, State.serialize(asset));
  }

  protected async getState(id: string): Promise<T> {
    let byteState: Uint8Array;
    try {
      byteState = await this.stub.getState(id);
    } catch (error) {
      throw new Error(`${ErrStateNotFound} : asset with ID = ${id} not found`);
    }
    return State.deserialize<T>(byteState);
  }
  protected async query(
    queryString: string = `{"selector": {}}`
  ): Promise<{ [key: string]: T }> {
    let iterator: Iterators.StateQueryIterator;
    try {
      iterator = await this.stub.getQueryResult(queryString);
    } catch (error) {
      throw new Error(`${ErrInvalidQueryString} : ${(error as Error).message}`);
    }
    return await this.getAssetFromIterator(iterator);
  }
  protected async getAssetFromIterator(
    iterator: Iterators.StateQueryIterator
  ): Promise<{ [key: string]: T }> {
    const out: { [key: string]: T } = {};
    let result = await iterator.next();
    while (!result.done) {
      try {
        out[result.value.key] = State.deserialize<T>(result.value.value);
        result = await iterator.next();
      } catch (error) {
        break;
      }
    }
    iterator.close();
    return out;
  }
}
