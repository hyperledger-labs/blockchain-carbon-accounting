import { QueryBundle } from "@blockchain-carbon-accounting/data-postgres";
import { FIELD, FIELDS, IFIELDS, IOP_MAP, OP_MAP } from "../models/commonTypes";

function validateQuery(bundle: QueryBundle) : boolean {
    // field name checking
    const validator: FIELD = FIELDS[bundle.field as keyof IFIELDS];
    if(validator == null) return false;

    // type checking
    if(validator.fieldType != bundle.fieldType) return false;

    // op checking
    if(!validator.op.includes(bundle.op)) return false;
    bundle.op = OP_MAP[bundle.op as keyof IOP_MAP];
    return true;
}

export function queryProcessor(bundles: Array<string>) : Array<QueryBundle> {
    const queryBundles: Array<QueryBundle> = [];
    if(typeof bundles == "string") {
        const elems: string[] = (bundles as string).split(',');
        const queryBundle: QueryBundle = {
            field: elems[0],
            fieldType: elems[1],
            value: elems[2],
            op: elems[3],
        }
        if(validateQuery(queryBundle)) queryBundles.push(queryBundle);
    }
    else if(bundles.length != 0) {
        bundles.forEach((bundle: string) => {
            const elems: string[] = bundle.split(',');
            const queryBundle: QueryBundle = {
                field: elems[0],
                fieldType: elems[1],
                value: elems[2],
                op: elems[3],
            }
            if(validateQuery(queryBundle)) queryBundles.push(queryBundle);
        });
    }
    return queryBundles;
}
