
const Sdk = require('coren-id-sdk');
const fs = require('fs')
const wal = Sdk.Wallet.Instance;

const ks = new Sdk.FileKeystore();
wal.setKeystore(ks)
const ccp = JSON.parse(fs.readFileSync("../connection-profile.json", "utf-8"))

const config = {
    stateStore: './tmp/statestore',
    caName: 'ca-auditor1',
    caAdmin: 'admin',
    caPassword: 'adminpw',
    tlsOptions: {
        trustedRoots: "-----BEGIN CERTIFICATE-----\nMIICFzCCAb2gAwIBAgIUScOQL2q9Yif/A4QjHHZQ75LnHQwwCgYIKoZIzj0EAwIw\naDELMAkGA1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMRQwEgYDVQQK\nEwtIeXBlcmxlZGdlcjEPMA0GA1UECxMGRmFicmljMRkwFwYDVQQDExBmYWJyaWMt\nY2Etc2VydmVyMB4XDTIwMTEyMDEzMjUwMFoXDTM1MTExNzEzMjUwMFowaDELMAkG\nA1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMRQwEgYDVQQKEwtIeXBl\ncmxlZGdlcjEPMA0GA1UECxMGRmFicmljMRkwFwYDVQQDExBmYWJyaWMtY2Etc2Vy\ndmVyMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEdaHiCdcPqoQ4uOG9gprqVTck\nFOkiNRhZffFkgjTQCTiwDO6PON7FSW/qQWqbukW01t4mViuV+dvgihQ7TauslaNF\nMEMwDgYDVR0PAQH/BAQDAgEGMBIGA1UdEwEB/wQIMAYBAf8CAQEwHQYDVR0OBBYE\nFJbqvKSWlsU3cY8eVggbXh+qdQ56MAoGCCqGSM49BAMCA0gAMEUCIQCS7hPlsnSg\nb6+xIr8H6MPII3zmzvImQwu1HiaKSmYcXgIgQ6JG4+sNBXxGdC5aabZyq9/ngdn/\n9gAddO9qP2TZszM=\n-----END CERTIFICATE-----\n",
        verify: false
    },
    caURL: "https://localhost:7054",
    mspId: 'auditor1',
    walletID: 'admin',
    asLocalhost: true,
    ccp: ccp,
    chaincodeName: "trustidcc",
    fcn: "proxy",
    channel: "utilityemissionchannel"
}

async function configureNetwork() {
    console.log("[*] Configuring network driver...")
    // Create HF driver
    var trustID = new Sdk.TrustIdHf(config);
    // Add and configure the network driver in our wallet.
    wal.addNetwork("hf", trustID);
    await wal.networks["hf"].configureDriver()
}

// Create you own DID key pair and register it in the TrustID platform.
async function createDID(){
    // Generate key pair locally.
    const did = await wal.generateDID("RSA", "openclimate", "password")
    console.log("[*] Generated DID: \n", did)
    await did.unlockAccount("password")
    // Register in the platform.
    await wal.networks.hf.createSelfIdentity(did)
    console.log("[*] Self identity registered")
    wal.setDefault(did)
    // Get the registered identity.
    let res = await wal.networks.hf.getIdentity(did, did.id)
    console.log("[*] Get registered identity\n", res)
}

async function serviceDID(){
    let access = {policy: Sdk.PolicyType.PublicPolicy};
    const did = await wal.generateDID("RSA", "openclimate", "password")
    console.log("[*] Generated DID: \n", did)
    await did.unlockAccount("password")
    // Register in the platform.
    await wal.networks.hf.createSelfIdentity(did)
    console.log("[*] Self identity registered")
    wal.setDefault(did)
    await wal.networks.hf.createService(did, `emissions-ser`, "emissionscontract", access, "utilityemissionchannel");
    await serviceInteraction(did)
}

// Interact with a service in the platform (you need to create a service before
// being able to call it).
async function serviceInteraction(did){
    // Get service
    let res = await wal.networks.hf.getService(did, `emissions-ser`)
    console.log("[*] Service info:\n", res)
    // Get Recorded emissions
    const args = ["11208","MyCompany"]
    res = await wal.networks.hf.invoke(did, "emissions-ser",["getAllEmissionsData", args], "utilityemissionchannel")
    console.log("[*] Record emissions:\n", res)
}

// Use the wallet to make offchain interactions with your DID
async function walletInteraction(){
    const did = await wal.generateDID("RSA", "openclimate", "password")
    const payload = {hello: "AWESOME PROJECT!!!"}
    await did.unlockAccount("password")
    console.log("[*] Signing payload: \n", payload)
    const sign = await did.sign(payload)
    console.log("[*] DID signature\n", sign)
    let verify = await did.verify(sign, did)
    console.log("[*] Signature verification\n", verify)
    const did2 = await wal.generateDID("RSA", "test", "test")
    verify = await did.verify(sign, did2)
    console.log("[*] Signature wrong verification\n", verify)
}


async function main(){
    await configureNetwork()
    // await createDID()
    await serviceDID()
    // await serviceInteraction()
    // await walletInteraction()
}

main()
    .then()
