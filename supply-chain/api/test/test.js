"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const crypto_utils_1 = require("../../src/crypto-utils");
const axios_1 = __importDefault(require("axios"));
const args = process.argv.splice(/ts-node/.test(process.argv[0]) || /node$/.test(process.argv[0]) ? 2 : 1);
let privateKey = null;
let ipfsPath = null;
let output = null;
for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '-pk') {
        i++;
        if (i == args.length)
            throw new Error('Missing argument file name after -pk');
        privateKey = args[i];
    }
    else if (a === '-fetch') {
        i++;
        if (i == args.length)
            throw new Error('Missing argment ipfs path after -fetch');
        ipfsPath = args[i];
    }
    else if (a === '-o') {
        i++;
        if (i == args.length)
            throw new Error('Missing output file name after -o');
        output = args[i];
    }
}
function decryptAndSave() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // const encryptedText = await downloadFileEncryptedWithoutPk(ipfsPath);
            const res = yield axios_1.default.get('http://127.0.0.1:5000/ipfs', { params: { ipfs: ipfsPath } });
            if (res.data.status === 'failed')
                throw Error("cannot download content");
            const edata0 = Buffer.from(res.data.msg, 'utf8');
            const kcount = edata0.readUint8(0);
            const edata = edata0.slice(1);
            const keys = [];
            for (let i = 0; i < kcount; i++) {
                try {
                    const kbuff = edata.slice(684 * i, 684 * (i + 1));
                    const key = (0, crypto_utils_1.decryptRSA)(kbuff.toString('utf8'), privateKey);
                    keys.push(key);
                }
                catch (err) {
                    // note: if not our key, it might just fail to decrypt here
                    // so don't print anything
                }
            }
            if (!keys.length) {
                throw new Error('Cannot decrypt the content with the given private key.');
            }
            const iv = edata.slice(684 * kcount, 684 * kcount + 16).toString('utf8');
            const econtent = edata.slice(684 * kcount + 16).toString('utf8');
            const ebuf = Buffer.from(econtent, 'hex');
            // try all the keys?
            let content = null;
            for (const key of keys) {
                try {
                    content = (0, crypto_utils_1.decryptAES)(ebuf, key, iv);
                    break;
                }
                catch (err) {
                    // if the wrong key is used this might fail
                    console.error('Error in trying to decrypt the content with key: ' + key);
                    console.error(err);
                }
            }
            return content;
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    });
}
decryptAndSave()
    .then(content => {
    (0, fs_1.writeFileSync)(output, content);
})
    .catch(err => {
    console.log(err);
});
