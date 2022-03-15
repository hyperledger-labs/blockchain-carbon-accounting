import { Response, Request } from 'express';
import { readdirSync, readFileSync, unlinkSync } from 'fs';
import path from 'path';

// import from supply chain
import { GroupedResult, GroupedResults, process_activities, group_processed_activities, issue_tokens_with_issuee } from '../../../src/emissions-utils';
import { downloadFileEncryptedWithoutPk } from '../../../src/ipfs-utils';

type OutputActivity = {
    id: string,
    tokenId?: string,
    error?: string
};

async function process_group(issuee: string, output_array: OutputActivity[], g: GroupedResult, activity_type: string, publicKeys: string[], mode = null) {
    const token_res = await issue_tokens_with_issuee(issuee, g, activity_type, publicKeys, mode);
    // add each activity to output array
    for (const a of g.content) {
        const out: OutputActivity = { id: a.activity.id };
        if (a.error) out.error = a.error;
        if (token_res && token_res.tokenId) out.tokenId = token_res.tokenId;
        else out.error = 'cannot issue';
        output_array.push(out);
    }
}

export function issueToken(req: Request, res: Response) {

    // get verbose flag
    const verbose = req.body.verbose;
    
    const issuee = req.body.issuee;
    if(issuee == undefined) {
        return res.status(400).json({
            status: "failed",
            msg: "Issuee was not given."
        });
    }

    // user can upload multiple files
    const files = req.files;
    if(files.length == 0) {
        return res.status(400).json({
            status: "failed",
            msg: "Key files was not given."
        });
    }
    const pubKeys: string[] = [];
    let data = undefined;
    for (const group in files) {
        if (Object.prototype.hasOwnProperty.call(files, group)) {
            const fileGroup: Express.Multer.File[] = files[group]; 
            fileGroup.forEach(file => {
                if(file.fieldname == 'keys') {
                    pubKeys.push(file.path);           
                } else if(file.fieldname == 'input') {
                    const data_raw = readFileSync(file.path, 'utf-8');
                    data = JSON.parse(data_raw);
                }
            });
        }
    }

    if(data == undefined || data.activities == undefined) {
        return res.status(400).json({
            status: "failed",
            msg: "There is no any data."
        });
    }

    process_activities(data.activities).then(async (activities)=>{
        // group the resulting emissions per activity type, and for shipment type group by mode:
        const grouped_by_type = group_processed_activities(activities);
        const output_array: OutputActivity[] = [];
        // now we can emit the tokens for each group and prepare the relevant data for final output
        try {
            for (const t in grouped_by_type) {
                if (t === 'shipment') {
                    const group = grouped_by_type[t] as GroupedResults;
                    for (const mode in group) {
                    const doc = group[mode] as GroupedResult;
                    await process_group(issuee, output_array, doc, t, pubKeys, mode);
                    }
                } else {
                    const doc = grouped_by_type[t] as GroupedResult;
                    await process_group(issuee, output_array, doc, t, pubKeys);
                }
            }
            // add back any errors we filtered before to the output
            grouped_by_type.errors = activities.filter(a=>a.error);
            if (verbose == 'true') return grouped_by_type;
            // short form output: return an Array of objects with {id, tokenId, error }
            for (const a of activities.filter(a=>a.error)) {
                output_array.push({id: a.activity.id, error: a.error});
            }
            return output_array;
        } catch (error) {
            return res.status(201).json(error);
        }
    }).then((output)=>{
        readdirSync('./keys').forEach(file => {
            unlinkSync(path.join('./keys', file));
        });
        return res.status(201).json(output);
    });
}

export async function fetchIpfs(req: Request, res: Response) {
    
    const ipfsPath = req.query.ipfs.toString();

    if(ipfsPath == null || ipfsPath == undefined) {
        return res.status(400).json({
            status: "failed",
            msg: "There is no path."
        });
    }
    try {
        const content = await downloadFileEncryptedWithoutPk(ipfsPath);
        return res.status(200).json({
            status: "success",
            msg: content
        });
    } catch (error) {
        return res.status(500).json({
            status: "failed",
            msg: "Internal error."
        });
    }


}

  
