// fabricRegistry.ts : interact with fabric-ca to enroll
// and register user
import {Logger, LoggerProvider, LogLevelDesc} from '@hyperledger/cactus-common';
import {PluginLedgerConnectorFabric} from '@hyperledger/cactus-plugin-ledger-connector-fabric';
import {IEnrollRegistrarRequest, IEnrollRegistrarResponse} from './I-fabricRegistry';
import {PluginKeychainMemory} from '@hyperledger/cactus-plugin-keychain-memory';

export interface IFabricRegistryOptions{
    logLevel:LogLevelDesc;
    fabricClient:PluginLedgerConnectorFabric;
    orgCAs:{[key:string]:{
        mspId:string,
        ca:string
    }};
    keychain:PluginKeychainMemory;
    adminUsername:string;
    adminPassword:string;
}

interface IX509Cert{
    type:string; // X509
    mspId:string;
    certificate:string;
    privateKey:string;
}

export class FabricRegistry{
    static readonly CLASS_NAME = 'FabricRegistry';

    static readonly X509Type = 'X509';

    private readonly log:Logger;
    get className():string{
        return FabricRegistry.CLASS_NAME;
    }

    constructor(private readonly opts:IFabricRegistryOptions){
        this.log = LoggerProvider.getOrCreate({level: opts.logLevel , label: this.className});
        const fnTag = `#constructor`;
        this.log.debug(`${fnTag} orgCAs : %o`,opts.orgCAs);
    }

    async enrollRegistrar(req:IEnrollRegistrarRequest):Promise<IEnrollRegistrarResponse>{
        const fnTag = '#enrollRegistrar';
        try {
            const refCA = this.opts.orgCAs[req.orgName];
            this.log.debug(`${fnTag} enroll ${req.orgName}'s registrar with ${refCA.ca}`);
            const ca = await this.opts.fabricClient.createCaClient(refCA.ca);
            const result = await ca.enroll({
                enrollmentID: this.opts.adminUsername,
                enrollmentSecret: this.opts.adminPassword
            });
            const cert:IX509Cert = {
                type: FabricRegistry.X509Type,
                mspId: refCA.mspId,
                certificate: result.certificate,
                privateKey: result.key.toBytes()
            };
            this.log.debug(`${fnTag} storing certificate inside keychain`);
            const key = `${req.orgName}_${this.opts.adminUsername}`;
            await this.opts.keychain.set(key,JSON.stringify(cert));
            return {
                orgName: req.orgName,
                msp : cert.mspId,
                caName : ca.getCaName()
            };
        } catch (error) {
            throw error;
        }
    }
}