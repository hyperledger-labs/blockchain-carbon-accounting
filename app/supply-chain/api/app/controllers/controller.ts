// import from supply chain
import {
    GroupedResult,
    GroupedResults, group_processed_activities,
    queue_issue_tokens, process_activities
} from '@blockchain-carbon-accounting/supply-chain-lib';
import { Request, Response } from 'express';
import { readdirSync, readFileSync, unlinkSync } from 'fs';
import path from 'path';

type OutputActivity = {
    id: string,
    tokenId?: string,
    nodeId?: string,
    emissionsRequestUuid?: string,
    error?: string
};

async function process_group(issuedFrom: string, issuedTo: string, output_array: OutputActivity[], g: GroupedResult, activity_type: string, mode?: string) {
    const token_res = await queue_issue_tokens(g, activity_type, mode, issuedFrom, issuedTo);
    // add each activity to output array
    for (const a of g.content) {
        const out: OutputActivity = { id: a.activity.id };
        if (a.error) {
            out.error = a.error;
        } else if (token_res && token_res.tokenId) {
            out.tokenId = token_res.tokenId;
            if (token_res.request) {
                if (token_res.request.uuid) {
                    out.emissionsRequestUuid = token_res.request.uuid;
                }
                if (token_res.request.node_id) {
                    out.nodeId = token_res.request.node_id;
                }
            }
        } else {
            out.error = 'cannot issue';
        }
        output_array.push(out);
    }
}

export function issueToken(req: Request, res: Response) {

    const verbose = req.body.verbose;
    const pretend = req.body.pretend;
    const issuedTo = req.body.issuedTo || req.body.issuee;
    // those are optional since we are queuing
    const issuedFrom = req.body.issuedFrom;

    console.log(`Start request, issue to ${issuedTo} verbose? ${verbose} pretend? ${pretend}`)
    if(!pretend && issuedTo == undefined) {
        console.log('== 400 No issuee.')
        return res.status(400).json({
            status: "failed",
            msg: "Issuee was not given."
        });
    }

    // user can upload multiple files, those are the input file and the keys
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    console.log('== files?', files)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any = undefined;
    for (const group in files) {
        if (Object.prototype.hasOwnProperty.call(files, group)) {
            const fileGroup: Express.Multer.File[] = files[group];
            fileGroup.forEach(file => {
                if(file.fieldname == 'input') {
                    const data_raw = readFileSync(file.path, 'utf-8');
                    data = JSON.parse(data_raw);
                } else {
                    console.error(`== unknown fieldname ${file.fieldname}`);
                }
            });
        }
    }

    if (!data || !data.activities) {
        console.log('== 400 No activities.')
        return res.status(400).json({
            status: "failed",
            msg: "There was no input data to process."
        });
    }

    process_activities(data.activities).then(async (activities)=>{
        // group the resulting emissions per activity type, and for shipment type group by mode:
        const grouped_by_type = await group_processed_activities(activities, issuedFrom);
        if (pretend) {
            return grouped_by_type;
        }
        const output_array: OutputActivity[] = [];
        // now we can emit the tokens for each group and prepare the relevant data for final output
        for (const t in grouped_by_type) {
            if (t === 'shipment') {
                const group = grouped_by_type[t] as GroupedResults;
                for (const mode in group) {
                    const issue_group = group[mode] as GroupedResults;
                    // Note: this issueToken endpoint forces the issuedFrom from the posted value.
                    for (const issued_from in issue_group) {
                        const doc = issue_group[issued_from] as GroupedResult;
                        await process_group(issuedFrom, issuedTo, output_array, doc, t, mode);
                    }
                }
            } else {
                const issue_group = grouped_by_type[t] as GroupedResults;
                // Note: this issueToken endpoint forces the issuedFrom from the posted value.
                for (const issued_from in issue_group) {
                    const doc = issue_group[issued_from] as GroupedResult;
                    await process_group(issuedFrom, issuedTo, output_array, doc, t);
                }
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

