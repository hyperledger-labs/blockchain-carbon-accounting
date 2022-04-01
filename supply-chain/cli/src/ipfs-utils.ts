import * as crypto from "crypto";
import { create } from 'ipfs-http-client';
import { encryptRSA, decryptRSA, encryptAES, decryptAES } from './crypto-utils';

export async function downloadFileEncrypted(ipfspath: string, pk: string) {
  try {
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

export async function uploadFileEncrypted(plain_content: string, pubkeys: string[]) {
  try {
    const ipfs_client = create({url: process.env.IPFS_URL});
    const buff = Buffer.from(plain_content, 'utf8');
    const key = crypto.randomBytes(16).toString('hex'); // 16 bytes -> 32 chars
    const iv = crypto.randomBytes(8).toString('hex');   // 8 bytes -> 16 chars
    const buffArr = [];
    // note: we need to keep track of the number of keys stored
    const countBuff = Buffer.allocUnsafe(1);
    countBuff.writeUInt8(pubkeys.length);
    buffArr.push(countBuff);
    for (const pubkey of pubkeys) {
      const ekey = encryptRSA(key, pubkey); // 32 chars -> 684 chars
      buffArr.push(Buffer.from(ekey, 'utf8'));
    }
    const ebuff = encryptAES(buff, key, iv);
    buffArr.push(Buffer.from(iv, 'utf8'));     // char length: 16
    buffArr.push(Buffer.from(ebuff, 'utf8'));

    const content = Buffer.concat(buffArr);

    const ipfs_res = await ipfs_client.add({content});
    return ipfs_res;
  } catch (err) {
    console.error(err)
    throw err;
  }
}

