'use-strict'
import { KEYUTIL, b64nltohex } from "jsrsasign";
import chai, { assert } from 'chai';
import asPromised from 'chai-as-promised';
import chaiHTTP from 'chai-http';
import Docker, { Container } from "dockerode";
import { randomBytes } from "crypto";
import { WsIdentityClient } from '../src/index';
import { WsWallet } from "ws-wallet";
//import { WsIdentityRouter } from "ws-identity";
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
        resolve(app);
      });
    });
}*/
const logLevel = 'DEBUG'
describe('test', async () => {
    let app,wsWallet;
    const port = '8700';
    const endpoint = `http://localhost:${port}`
    let pubKeyHex: string;
    before(async () => {
        //app = await startApp(port)

        // For this test to work first start WsIdentityServer
        // a prebuilt docker image is available at ghcr.io/brioux/ws-identity
        // TODO run the container within the test...
        
        wsWallet = new WsWallet({
            keyName: "admin",
            strictSSL: false,
            logLevel,
        })
        pubKeyHex = wsWallet.getPubKeyHex();
    });
    after(async () => {
        //app.close();
        wsWallet.close();
    });
 
    let signature;
    let sessionId;

    let wsIdClient;
    it('create new session id for pubKeyHex', async () => {
        wsIdClient = new WsIdentityClient({
            apiVersion: 'v1',
            endpoint,
            rpDefaults: {
                strictSSL: false
            },
        }) 
        const newSidResp = JSON.parse(
            await wsIdClient.write('session/new', { 
                pubKeyHex,
                keyName: wsWallet.keyName,
            }, {})
        )
        sessionId = newSidResp.sessionId;
        const resp = await wsWallet.open(sessionId,newSidResp.url);
        signature = resp.signature;
        sessionId = resp.sessionId;
        resp.signature.should.be.string;
        resp.sessionId.should.be.string;
    })

    let digest
    it('should sign digests', async () =>  {
        wsIdClient = new WsIdentityClient({
            endpoint,
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