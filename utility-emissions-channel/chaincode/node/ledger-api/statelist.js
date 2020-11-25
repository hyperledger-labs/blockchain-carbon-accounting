/*
SPDX-License-Identifier: Apache-2.0
*/

"use strict";
const State = require("./state.js");

/**
 * StateList provides a named virtual container for a set of ledger states.
 * Each state has a unique key which associates it with the container, rather
 * than the container containing a link to the state. This minimizes collisions
 * for parallel transactions on different states.
 */
class StateList {
  /**
   * Store Fabric context for subsequent API access, and name of list
   */
  constructor(ctx, listName) {
    this.ctx = ctx;
    this.name = listName;
    this.supportedClasses = {};
  }

  /**
   * Add a state to the list. Creates a new state in worldstate with
   * appropriate composite key.  Note that state defines its own key.
   * State object is serialized before writing.
   */
  async addState(state, uuid) {
    // await this.ctx.stub.putState('<UUID HERE>', Buffer.from(JSON.stringify(state)));
    // let key = this.ctx.stub.createCompositeKey(this.name, state.getSplitKey());
    let data = State.serialize(state);
    await this.ctx.stub.putState(uuid, data);
  }

  /**
   * Get a state from the list using supplied keys. Form composite
   * keys to retrieve state from world state. State data is deserialized
   * into JSON object before being returned.
   */
  async getState(uuid) {
    const emissionasBytes = await this.ctx.stub.getState(uuid); // get the car from chaincode state
    if (!emissionasBytes || emissionasBytes.length === 0) {
      throw new Error(`${uuid} does not exist`);
    }
    console.log(emissionasBytes.toString());
    return emissionasBytes.toString();
  }

  async getAllState(queryData) {
    const allResults = [];
    var stringQuery = `{"selector": {"utilityId": "${queryData.utilityId}", "partyId": "${queryData.partyId}"}}`;
    const iterator = await this.ctx.stub.getQueryResult(stringQuery);
    let result = await iterator.next();
    while (!result.done) {
      const strValue = Buffer.from(result.value.value.toString()).toString("utf8");
      let record;
      try {
        record = JSON.parse(strValue);
      } catch (err) {
        console.log(err);
        record = strValue;
      }
      allResults.push({ Key: result.value.key, Record: record });
      result = await iterator.next();
    }
    return JSON.stringify(allResults);
  }

  /**
   * Update a state in the list. Puts the new state in world state with
   * appropriate composite key.  Note that state defines its own key.
   * A state is serialized before writing. Logic is very similar to
   * addState() but kept separate becuase it is semantically distinct.
   */
  async updateState(state) {
    let key = this.ctx.stub.createCompositeKey(this.name, state.getSplitKey());
    let data = State.serialize(state);
    await this.ctx.stub.putState(key, data);
  }

  /** Stores the class for future deserialization */
  use(stateClass) {
    this.supportedClasses[stateClass.getClass()] = stateClass;
  }
}

module.exports = StateList;
