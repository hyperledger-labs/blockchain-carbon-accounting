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
exports.issueToken = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
// import from supply chain
const emissions_utils_1 = require("../../../src/emissions-utils");
function process_group(issuee, output_array, g, activity_type, publicKeys, mode = null) {
    return __awaiter(this, void 0, void 0, function* () {
        const token_res = yield (0, emissions_utils_1.issue_tokens_with_issuee)(issuee, g, activity_type, publicKeys, mode);
        // add each activity to output array
        for (const a of g.content) {
            const out = { id: a.activity.id };
            if (a.error)
                out.error = a.error;
            if (token_res && token_res.tokenId)
                out.tokenId = token_res.tokenId;
            else
                out.error = 'cannot issue';
            output_array.push(out);
        }
    });
}
function issueToken(req, res) {
    const verbose = req.body.verbose;
    const pretend = req.body.pretend;
    const issuee = req.body.issuee;
    console.log(`Start request, issue to ${issuee} verbose? ${verbose} pretend? ${pretend}`);
    if (!pretend && issuee == undefined) {
        console.log('== 400 No issuee.');
        return res.status(400).json({
            status: "failed",
            msg: "Issuee was not given."
        });
    }
    // user can upload multiple files, those are the input file and the keys
    const files = req.files;
    console.log('== files?', files);
    const pubKeys = [];
    let data = undefined;
    for (const group in files) {
        if (Object.prototype.hasOwnProperty.call(files, group)) {
            const fileGroup = files[group];
            fileGroup.forEach(file => {
                if (file.fieldname == 'keys') {
                    pubKeys.push(file.path);
                }
                else if (file.fieldname == 'input') {
                    const data_raw = (0, fs_1.readFileSync)(file.path, 'utf-8');
                    data = JSON.parse(data_raw);
                }
            });
        }
    }
    if (!pubKeys.length && !pretend) {
        console.log('== 400 No keys.');
        return res.status(400).json({
            status: "failed",
            msg: "There was no public key file given."
        });
    }
    if (data == undefined || data.activities == undefined) {
        console.log('== 400 No activities.');
        return res.status(400).json({
            status: "failed",
            msg: "There was no input data to process."
        });
    }
    (0, emissions_utils_1.process_activities)(data.activities).then((activities) => __awaiter(this, void 0, void 0, function* () {
        // group the resulting emissions per activity type, and for shipment type group by mode:
        const grouped_by_type = (0, emissions_utils_1.group_processed_activities)(activities);
        if (pretend) {
            return grouped_by_type;
        }
        const output_array = [];
        // now we can emit the tokens for each group and prepare the relevant data for final output
        for (const t in grouped_by_type) {
            if (t === 'shipment') {
                const group = grouped_by_type[t];
                for (const mode in group) {
                    const doc = group[mode];
                    yield process_group(issuee, output_array, doc, t, pubKeys, mode);
                }
            }
            else {
                const doc = grouped_by_type[t];
                yield process_group(issuee, output_array, doc, t, pubKeys);
            }
        }
        // add back any errors we filtered before to the output
        grouped_by_type.errors = activities.filter(a => a.error);
        if (verbose == 'true')
            return grouped_by_type;
        // short form output: return an Array of objects with {id, tokenId, error }
        for (const a of activities.filter(a => a.error)) {
            output_array.push({ id: a.activity.id, error: a.error });
        }
        return output_array;
    })).then((output) => {
        (0, fs_1.readdirSync)('./keys').forEach(file => {
            (0, fs_1.unlinkSync)(path_1.default.join('./keys', file));
        });
        console.log('== 201 Output:', output);
        return res.status(201).json(output);
    }).catch((error) => {
        console.log('== 201 Error:', error);
        return res.status(201).json(error);
    });
}
exports.issueToken = issueToken;
