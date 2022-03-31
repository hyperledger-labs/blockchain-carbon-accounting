import { Response, Request } from 'express';
import { readdirSync, readFileSync, unlinkSync } from 'fs';
import path from 'path';

// import from supply chain
import { GroupedResult, GroupedResults, process_activities, group_processed_activities, issue_tokens_with_issuee } from '../../../src/emissions-utils';

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

    const verbose = req.body.verbose;
    const pretend = req.body.pretend;
    const issuee = req.body.issuee;

    console.log(`Start request, issue to ${issuee} verbose? ${verbose} pretend? ${pretend}`)
    if(!pretend && issuee == undefined) {
        console.log('== 400 No issuee.')
        return res.status(400).json({
            status: "failed",
            msg: "Issuee was not given."
        });
    }

    // user can upload multiple files, those are the input file and the keys
    const files = req.files;
    console.log('== files?', files)
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

    if (!pubKeys.length && !pretend) {
        console.log('== 400 No keys.')
        return res.status(400).json({
            status: "failed",
            msg: "There was no public key file given."
        });
    }
    if (data == undefined || data.activities == undefined) {
        console.log('== 400 No activities.')
        return res.status(400).json({
            status: "failed",
            msg: "There was no input data to process."
        });
    }

    process_activities(data.activities).then(async (activities)=>{
        // group the resulting emissions per activity type, and for shipment type group by mode:
        const grouped_by_type = group_processed_activities(activities);
        if (pretend) {
            return grouped_by_type;
        }
        const output_array: OutputActivity[] = [];
        // now we can emit the tokens for each group and prepare the relevant data for final output
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
        if (grouped_by_type.errors) {
            grouped_by_type.errors.forEach(e=>{
                console.log("!! Error for ", e);
            })
        }
        if (verbose == 'true') return grouped_by_type;
        // short form output: return an Array of objects with {id, tokenId, error }
        for (const a of activities.filter(a=>a.error)) {
            output_array.push({id: a.activity.id, error: a.error});
        }
        return output_array;
    }).then((output)=>{
        readdirSync('./keys').forEach(file => {
            unlinkSync(path.join('./keys', file));
        });
        console.log('== 201 Output:', output)
        return res.status(201).json(output);
    }).catch((error)=>{
        console.log('== 500 Error:', error)
        return res.status(500).json(error);
    });
}

  
