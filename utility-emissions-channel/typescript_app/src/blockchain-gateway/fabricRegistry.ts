// fabricRegistry.ts : interact with fabric-ca to enroll
// and register user
import {Logger, LoggerProvider, LogLevelDesc} from '@hyperledger/cactus-common';
import {PluginLedgerConnectorFabric} from '@hyperledger/cactus-plugin-ledger-connector-fabric';
import {IEnrollRegistrarRequest, IEnrollRegistrarResponse} from './I-fabricRegistry';
import {PluginKeychainVault} from '@hyperledger/cactus-plugin-keychain-vault';
import Client from 'fabric-client';

export interface IFabricRegistryOptions{
    logLevel:LogLevelDesc;
    fabricClient:PluginLedgerConnectorFabric;
    orgCAs:{[key:string]:{
        mspId:string,
        ca:string
    }};
    keychain:PluginKeychainVault;
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
            if (await this.opts.keychain.has(`${req.orgName}_${this.opts.adminUsername}`)){
                throw new Error(`${this.opts.adminUsername} of organizations ${req.orgName} is already enrolled`);
            }
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
                caName : ca.getCaName(),
                info: 'ORG ADMIN REGISTERED'
            };
        } catch (error) {
            throw error;
        }
    }

    async enrollUser(userId:string,orgName:string,affiliation:string){
        const fnTag = '#enrollUser';
        try {
            if (await this.opts.keychain.has(`${orgName}_${userId}`)){
                throw new Error(`${userId} of organizations ${orgName} is already enrolled`);
            }
            const refCa = this.opts.orgCAs[orgName];
            if (!refCa){
                throw new Error(`organizations ${orgName} doesn't exists`);
            }
            // check if admin is enrolled or not
            const rawAdminCerts:string = await this.opts.keychain.get(`${orgName}_${this.opts.adminUsername}`);
            if (!rawAdminCerts){
                throw new Error(`${orgName}'s admin is not enrolled, please enroll admin first`);
            }
            const adminCerts = JSON.parse(rawAdminCerts);
            // register user
            // build admin user
            this.log.debug(`${fnTag} building admin user`);
            const builder = new Client();
            const admin = await builder.createUser(
                {
                    username:this.opts.adminUsername,
                    mspid : refCa.mspId,
                    skipPersistence: true,
                    cryptoContent : {
                        privateKeyPEM : adminCerts.privateKey,
                        signedCertPEM : adminCerts.certificate
                    }
                }
            );

            const ca = await this.opts.fabricClient.createCaClient(refCa.ca);
            this.log.debug(`${fnTag} registering ${userId}`);
            const secret = await ca.register({
                enrollmentID: userId,
                affiliation,
                role: 'client'
            },admin);

            this.log.debug(`${fnTag} enrolling ${userId}`);
            const result = await ca.enroll({
                enrollmentID: userId,
                enrollmentSecret: secret
            });
            const cert:IX509Cert = {
                type: FabricRegistry.X509Type,
                mspId: refCa.mspId,
                certificate: result.certificate,
                privateKey: result.key.toBytes()
            };
            this.log.debug(`${fnTag} storing certificate inside keychain`);
            const key = `${orgName}_${userId}`;
            await this.opts.keychain.set(key,JSON.stringify(cert));
            this.log.debug(`${fnTag} ${userId} successfully enrolled`);
        } catch (error) {
            throw error;
        }
    }
}