import { getRepository, SelectQueryBuilder } from "typeorm";
import { Token } from "../models/token.model";  
import { QueryBundle, TokenPayload } from "../models/commonTypes";
import { buildQueries } from './base.repo';

export const selectAll = async (): Promise<Array<Token>> => {
    const tokenRepository = getRepository(Token);
    return await tokenRepository.find();
};

export const selectPaginated = async (offset: number, limit: number, bundles: Array<QueryBundle>): Promise<Array<Token>> => {
    let selectBuilder: SelectQueryBuilder<Token> = getRepository(Token).createQueryBuilder("token");
    
    // category by issuer address
    selectBuilder = buildQueries('token', selectBuilder, bundles);
    return selectBuilder
            .limit(limit)
            .offset(offset)
            .orderBy('token.tokenId', 'ASC')
            .getMany();
}

export const insertToken = async (payload: TokenPayload): Promise<Token> => {
    const tokenRepository = getRepository(Token);
    const token = new Token();
    return await tokenRepository.save({
        ...token,
        ...payload
    });
}

export const updateTotalIssued = async (tokenId: number, amount: number) => {
    try {
        await getRepository(Token)
            .createQueryBuilder('token')
                .update(Token)
                .set({totalIssued: () => `token.\"totalIssued\" + ${amount}`})
                .where("tokenId = :tokenId", {tokenId})
                .execute();    
    } catch (error) {
        throw new Error("Cannot update totalIssued.");
    }
}

export const updateTotalRetired = async (tokenId: number, amount: number) => {
    try {
        await getRepository(Token)
            .createQueryBuilder('token')
                .update(Token)
                .set({totalRetired: () => `token.\"totalRetired\" + ${amount}`})
                .where("tokenId = :tokenId", {tokenId})
                .execute();    
    } catch (error) {
        throw new Error("Cannot update totalRetired.");
    }
}

export const countTokens = async (bundles: Array<QueryBundle>): Promise<number> => {
    try {
        let selectBuilder: SelectQueryBuilder<Token> = getRepository(Token).createQueryBuilder("token");
        selectBuilder = buildQueries('token', selectBuilder, bundles);
        return selectBuilder.getCount();
    } catch (error) {
        throw new Error("Cannot get tokens count.");       
    }
}

export const truncateTokens = async () => {
    await getRepository(Token)
        .createQueryBuilder('token')
        .delete()
        .execute();
}