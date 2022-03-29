import { SelectQueryBuilder } from 'typeorm';
import { QueryBundle, StringPayload } from '../models/commonTypes';

const BALANCE_FIELDS = ['issuee', 'tokenId', 'balance', 'retired', 'transferred'];

export function buildQueries(table: string, builder: SelectQueryBuilder<any>, queries: Array<QueryBundle>) : SelectQueryBuilder<any> {
    const len = queries.length;
    for (let i = 0; i < len; i++) {
        const query: QueryBundle = queries[i];
        
        // last payload
        const payload: StringPayload = {};
        if(query.fieldType == "string") {
            
            // process 'like' exception for payload
            if(query.op == 'like') payload[query.field] = '%' + query.value as string + '%';
            else if(query.op == '=') payload[query.field] = query.value as string;

        }
        else if (query.fieldType == 'number')
            payload[query.field] = query.value as number;
        else continue;
        
        // make case insensitive for issuee issuer cases
        if(!BALANCE_FIELDS.includes(query.field)) {
            console.log(query);
            table = 'token';
        }
        if(query.field == 'issuee' || query.field == 'issuer') {
            builder = builder.andWhere(`LOWER(${table}.${query.field}) ${query.op} LOWER(:${query.field})`, payload);
        } else {
            builder = builder.andWhere(`${table}.${query.field} ${query.op} :${query.field}`, payload);
        }

    }
    return builder;
}