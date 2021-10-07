'use-strict'
import { KEYUTIL, b64nltohex } from "jsrsasign";
import chai, { assert } from 'chai';
import asPromised from 'chai-as-promised';
import chaiHTTP from 'chai-http';
import Docker, { Container } from "dockerode";
import { randomBytes } from "crypto";
import { WsIdentityClient } from '../src/index';
import { WsWallet } from "ws-wallet";
import { WsIdentityRouter } from "ws-identity";
import http from "http";
//import express, { Application } from "express";

chai.use(chaiHTTP);
const should = chai.should();
chai.use(asPromised);

/*function startApp(port: string): Promise<Application> {
    const app: Application = express()

    const server = http.createServer(app);
    new WsIdentityRouter({
        app,
        server,
        wsMount: '/sessions',
        logLevel: 'debug'
    }); 
    return new Promise((resolve) => {
      server.listen(port, () => {
        console.log(server.address())
        resolve(app);
      });
    });
}*/

describe('test', async () => {
    let app,wsWallet;
    const port = '8300';
    before(async () => {
        //app = await startApp(port)

        // For this test to work first start WsIdentityServer
        // a prebuilt docker image is available at brioux/ws-identity:0.0.4
        // TODO run the container within the test...
        wsWallet = new WsWallet({
            endpoint: `https://[::]:${port}`,
            keyName: "admin",
            strictSSL: false,
            logLevel: "debug"
        })
    });
    after(async () => {
        //app.close();
        wsWallet.close();
    });
 
    let signature;
    let sessionId: string;
    let pubKeyHex: string;
    it('create new session id for pubKeyHex', async () => {
        pubKeyHex = wsWallet.getPubKeyHex();
        const resp = await wsWallet.open();
        signature = resp.signature;
        sessionId = resp.sessionId;
        resp.signature.should.be.string;
        resp.sessionId.should.be.string;
    })
    let wsIdClient;
    let digest
    it('should sign digests', async () =>  {

        wsIdClient = new WsIdentityClient({
            endpoint: 'https://localhost:8300',
            pathPrefix: '/identity',
            rpDefaults: {
                strictSSL: false
            },
            sessionId: sessionId,
            signature: signature,
        })
        digest = randomBytes(16).toString("base64");
        signature = await wsIdClient.write("sign", {digest: digest},{});
        signature.should.be.string
        digest = randomBytes(16).toString("base64");
        signature = await wsIdClient.write("sign", {digest: digest},{});
        signature.should.be.string;
    })
    it('get public key ecdsa and verify signature', async () =>  {
        const resp = await wsIdClient.read("get-pub");
        resp.should.be.string
        const pubKeyEcdsa = KEYUTIL.getKey(resp);
        const verified = pubKeyEcdsa.verifyHex(
            b64nltohex(digest),
            b64nltohex(signature),
            pubKeyHex
        );
        verified.should.be.true
    })
})