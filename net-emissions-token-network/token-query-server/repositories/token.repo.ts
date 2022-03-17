import { getRepository, SelectQueryBuilder } from "typeorm";
import { Token } from "../models/token.model";  
import { QueryBundle, StringPayload, TokenPayload } from "../models/commonTypes";

function buildQueries(builder: SelectQueryBuilder<Token>, queries: Array<QueryBundle>) : SelectQueryBuilder<Token> {
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
        
        if(query.nextOp == "and") {
            // if(query.op ==)
            builder = builder.andWhere(`token.${query.field} ${query.op} :${query.field}`, payload);
        } else if (query.nextOp == "or") {
            builder = builder.orWhere(`token.${query.field} ${query.op} :${query.field}`, payload);
        }
    }
    return builder;
}

export const selectAll = async (): Promise<Array<Token>> => {
    const tokenRepository = getRepository(Token);
    return await tokenRepository.find();
};

export const selectPaginated = async (offset: number, limit: number, bundles: Array<QueryBundle>): Promise<Array<Token>> => {
    let selectBuilder: SelectQueryBuilder<Token> = getRepository(Token).createQueryBuilder("token");
    
    // category by issuer address
    selectBuilder = buildQueries(selectBuilder, bundles);
    return selectBuilder
            .limit(limit)
            .offset(offset)
            .getMany();
}

export const insert = async (payload: TokenPayload): Promise<Token> => {
    const tokenRepository = getRepository(Token);
    const token = new Token();
    return await tokenRepository.save({
        ...token,
        ...payload
    });
}

export const count = async (): Promise<number> => {
    const tokenRepository = getRepository(Token);
    const count = await tokenRepository.count();
    return count;
}