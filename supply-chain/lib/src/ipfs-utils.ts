import * as crypto from "crypto";
import { create } from 'ipfs-http-client';
import { encryptRSAKeyFileName, encryptRSA, decryptRSA, encryptAES, decryptAES, encryptWithPublicKey, encryptWithEncPublicKey, decryptWithPrivKey } from './crypto-utils';

export async function downloadFileRSAEncrypted(path: string, pk: string) {
  try {
    const ipfspath = path.startsWith('ipfs://') ? path.substring(7) : path;
    const ipfs_client = create({url: process.env.IPFS_URL});
    const data = [];
    for await (const chunk of ipfs_client.cat(ipfspath)) {
      data.push(chunk);
    }
    const edata0 = Buffer.concat(data);

    // first contains the number of keys
    // then each key is 684
    // then the IV is 16
    // then finally the encrypted content
    const kcount = edata0.readUInt8(0);
    const edata = edata0.slice(1);
    const keys: string[] = [];
    for (let i=0; i<kcount; i++) {
      try {
        const kbuff = edata.slice(684*i, 684*(i+1));
        const key = decryptRSA(kbuff.toString('utf8'), pk);
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

    return content
  } catch (err) {
    console.log(err)
    throw err;
  }
}

export async function downloadFileWalletEncrypted(path: string, pk: string) {
  try {
    const ipfspath = path.startsWith('ipfs://') ? path.substring(7) : path;
    const ipfs_client = create({url: process.env.IPFS_URL});
    const data = [];
    for await (const chunk of ipfs_client.cat(ipfspath)) {
      data.push(chunk);
    }
    const edata0 = Buffer.concat(data);
    const content = decryptWithPrivKey(pk, edata0);
    return content;

  } catch (error) {
    console.error(error);
  }
}

export async function downloadFileEncryptedWithoutPk(ipfspath: string) {
  try {
    const ipfs_client = create({url: process.env.IPFS_URL});
    const data = [];
    for await (const chunk of ipfs_client.cat(ipfspath)) {
      data.push(chunk);
    }
    const edata0 = Buffer.concat(data);
    return edata0.toString();
  } catch (err) {
    console.log(err)
    throw err;
  }

}

export async function uploadFileRSAEncrypted(plain_content: string|Buffer, pubkeys: string[], pubkeysContent = false, name = 'content.json') {
  try {
    const ipfs_client = create({url: process.env.IPFS_URL});
    const buff = plain_content instanceof Buffer ? plain_content : Buffer.from(plain_content, 'utf8');
    const key = crypto.randomBytes(16).toString('hex'); // 16 bytes -> 32 chars
    const iv = crypto.randomBytes(8).toString('hex');   // 8 bytes -> 16 chars
    const buffArr = [];
    // note: we need to keep track of the number of keys stored
    const countBuff = Buffer.allocUnsafe(1);
    countBuff.writeUInt8(pubkeys.length);
    buffArr.push(countBuff);
    for (const pubkey of pubkeys) {
      if (pubkeysContent) {
        const ekey = encryptRSA(key, pubkey); // 32 chars -> 684 chars
        buffArr.push(Buffer.from(ekey, 'utf8'));
      } else {
        const ekey = encryptRSAKeyFileName(key, pubkey); // 32 chars -> 684 chars
        buffArr.push(Buffer.from(ekey, 'utf8'));
      }
    }
    const ebuff = encryptAES(buff, key, iv);
    buffArr.push(Buffer.from(iv, 'utf8'));     // char length: 16
    buffArr.push(Buffer.from(ebuff, 'utf8'));

    const content = Buffer.concat(buffArr);

    // the add method needs to have a parent directory, this
    // will become the CID in IPFS
    const ipfs_res = await ipfs_client.add({content, path: `/tmp/${name}`});
    return { ...ipfs_res, ipfs_path: `ipfs://${ipfs_res.cid}/${name}`, filename: name}
  } catch (err) {
    console.error(err)
    throw err;
  }
}

export async function uploadFileWalletEncrypted(plain_content: string|Buffer, pubkeys: string[], pubkeysContent = false, name = 'content.json') {
  try {
    if (!pubkeys || !pubkeys.length) {
      throw new Error('No public keys provided.');
    }
    const txt = plain_content instanceof Buffer ? plain_content.toString('base64') : plain_content;
    const ipfs_client = create({url: process.env.IPFS_URL});
    // console.log(plain_content);
    const content = pubkeysContent ? 
      await encryptWithEncPublicKey(pubkeys[0], txt) :
      await encryptWithPublicKey(pubkeys[0], txt);
    const ipfs_res = await ipfs_client.add({
      content,path: `/tmp/${name}`
    });
    return { ...ipfs_res, ipfs_path: `ipfs://${ipfs_res.cid}/${name}`, filename: name}
  } catch (error) {
    console.error(error);
    throw error;
  }
}
