import { generateKeyPair } from '../../supply-chain/lib/src/crypto-utils';
import { existsSync, unlinkSync } from 'fs';
import { expect } from 'chai';

function cleanup() {
  if (existsSync('tests-private.pem')) unlinkSync('tests-private.pem');
  if (existsSync('tests-public.pem')) unlinkSync('tests-public.pem');
}

describe("Emissions and Tokens requests test", function() {
  before(function () {
    cleanup();
  });
  after(function () {
    cleanup();
  });

  it("should allow an emissions request to be processed", async function() {
    // Generate 2 public/private key pairs
    generateKeyPair('tests');
    // check they exist
    expect(existsSync('tests-private.pem')).to.be.true;
    expect(existsSync('tests-public.pem')).to.be.true;

    // Store the public keys for the 2 default auditors in hardhat, not the demo ones.
    // Generate emissions audit requests from the input.json file. We can add a TEST mode so that the code will automatically return a fixed emissions for the shipments and flights, instead of requiring Google and UPS API's in the tests. Just hard code the actual numbers for input.json into the TEST mode.
    // Process the requests.
    // Issue the tokens from the auditors
    // Verify the tokens are issued in the right units
    // Get the files and decrypt with the private keys
    // Verify the files have the correct sha256
    console.log('test');
  })
});
