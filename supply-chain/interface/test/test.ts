import { writeFileSync } from "fs";
import { downloadFileEncryptedWithoutPk } from "../../src/ipfs-utils";
import { decryptAES, decryptRSA } from "../../src/crypto-utils";
import axios from "axios";

const args = process.argv.splice( /ts-node/.test(process.argv[0]) || /node$/.test(process.argv[0]) ? 2 : 1 );
let privateKey: string = null;
let ipfsPath: string = null;
let output: string = null;

for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if(a === '-pk') {
        i++;
        if(i == args.length) throw new Error('Missing argument file name after -pk');
        privateKey = args[i];
    } else if (a === '-fetch') {
        i++;
        if(i == args.length) throw new Error('Missing argment ipfs path after -fetch');
        ipfsPath = args[i];
    } else if (a === '-o') {
        i++;
        if(i == args.length) throw new Error('Missing output file name after -o');
        output = args[i];
    }
}

type Response = {
    data: {
        status: string,
        msg: string
    }
}

async function decryptAndSave() {
    try {
        // const encryptedText = await downloadFileEncryptedWithoutPk(ipfsPath);
        
        const res: Response = await axios.get('http://127.0.0.1:5000/ipfs', {params: {ipfs: ipfsPath}});
        
        if(res.data.status === 'failed') throw Error("cannot download content");
        const edata0 = Buffer.from(res.data.msg, 'utf8');

        const kcount = edata0.readUint8(0);
        const edata = edata0.slice(1);
        const keys: string[] = [];
        for (let i=0; i<kcount; i++) {
        try {
            const kbuff = edata.slice(684*i, 684*(i+1));
            const key = decryptRSA(kbuff.toString('utf8'), privateKey);
            keys.push(key);
        } catch (err) {
            // note: if not our key, it might just fail to decrypt here
            // so don't print anything
        }
        }
        if (!keys.length) {
        throw new Error('Cannot decrypt the content with the given private key.');
        }
        const iv = edata.slice(684*kcount, 684*kcount+16).toString('utf8');
        const econtent = edata.slice(684*kcount+16).toString('utf8');
        const ebuf = Buffer.from(econtent, 'hex');
        // try all the keys?
        let content = null;
        for (const key of keys) {
        try {
            content = decryptAES(ebuf, key, iv);
            break;
        } catch (err) {
            // if the wrong key is used this might fail
            console.error('Error in trying to decrypt the content with key: '+key);
            console.error(err);
        }
        }

        return content;
    } catch (error) {
        console.log(error)
        throw error;
    }
}

decryptAndSave()
    .then(content => {
        writeFileSync(output, content);
    })
    .catch(err => {
        console.log(err);
    });


