
import * as crypto from "crypto";
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { getEncryptionPublicKey, encrypt, decrypt } from '@metamask/eth-sig-util';

function getFileFromPath(path: string) {
  const absolutePath = resolve(path)
  return readFileSync(absolutePath, 'utf8')
}

export async function encryptWithPublicKey(privKeyPath: string, toEncrypt: string) {
  const privKey = getFileFromPath(privKeyPath);
  const encPubKey = getEncryptionPublicKey(privKey);
  const encrypted = encrypt({
    data: toEncrypt, 
    publicKey: encPubKey, 
    version: "x25519-xsalsa20-poly1305"
  });
  return Buffer.concat([
    Buffer.from(encrypted.nonce, 'utf8'),
    Buffer.from(encrypted.ephemPublicKey, 'utf8'),
    Buffer.from(encrypted.version, 'utf8'),
    Buffer.from(encrypted.ciphertext, 'utf8')
  ]);
}

export async function encryptWithEncPublicKey(encPubKey: string, toEncrypt: string) {
  const encrypted = encrypt({
    data: toEncrypt, 
    publicKey: encPubKey, 
    version: "x25519-xsalsa20-poly1305"
  });
  return Buffer.concat([
    Buffer.from(encrypted.nonce, 'utf8'),
    Buffer.from(encrypted.ephemPublicKey, 'utf8'),
    Buffer.from(encrypted.version, 'utf8'),
    Buffer.from(encrypted.ciphertext, 'utf8')
  ]);
}

export async function decryptWithPrivKey(privKeyPath: string, toDecrypt: Buffer) {
  const privateKey = getFileFromPath(privKeyPath);
  const encryptedData = {
    nonce: toDecrypt.toString('utf8', 0, 32),
    ephemPublicKey: toDecrypt.toString('utf8', 32, 76),
    version: toDecrypt.toString('utf8', 76, 100),
    ciphertext: toDecrypt.toString('utf8', 100, toDecrypt.length)
  }
  return decrypt({encryptedData, privateKey});
}

export function encryptRSAKeyFileName(toEncrypt: string, pubkeyPath: string) {
  const publicKey = getFileFromPath(pubkeyPath)
  const buffer = Buffer.from(toEncrypt, 'utf8')
  const encrypted = crypto.publicEncrypt(publicKey, buffer)
  return encrypted.toString('base64')
}

export function encryptRSA(toEncrypt: string, publicKey: string) {
  const buffer = Buffer.from(toEncrypt, 'utf8')
  const encrypted = crypto.publicEncrypt(publicKey, buffer)
  return encrypted.toString('base64')
}

export function decryptRSA(toDecrypt: string, privkeyPath: string) {
  const privateKey = getFileFromPath(privkeyPath)
  const buffer = Buffer.from(toDecrypt, 'base64')
  const decrypted = crypto.privateDecrypt(
  {
    key: privateKey.toString(),
    passphrase: '',
  },
  buffer,
  )
  return decrypted.toString('utf8')
}

export function encryptAES(buffer: Buffer, secretKey: string, iv: string) {
  const cipher = crypto.createCipheriv('aes-256-ctr', secretKey, iv);
  const data = cipher.update(buffer);
  const encrypted = Buffer.concat([data, cipher.final()]);
  return encrypted.toString('hex')
}

export function decryptAES(buffer: Buffer, secretKey: string, iv: string) {
  const decipher = crypto.createDecipheriv('aes-256-ctr', secretKey, iv);
  const data = decipher.update(buffer)
  const decrpyted = Buffer.concat([data, decipher.final()]);
  return decrpyted;
}

export function generateKeyPair(name: string) {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: 'pkcs1',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs1',
      format: 'pem',
      cipher: 'aes-256-cbc',
      passphrase: '',
    },
  });

  writeFileSync(`${name}-private.pem`, privateKey);
  writeFileSync(`${name}-public.pem`, publicKey);
}

const HASH_ALGO = 'sha256';
export function hash_content(content: Buffer|string) {
  const h = crypto.createHash(HASH_ALGO).update(content).digest('hex');
  return { type: HASH_ALGO, value: h };
}
