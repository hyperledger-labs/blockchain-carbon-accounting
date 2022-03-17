import { getRepository } from "typeorm";
import { Token } from "../models/token.model";  
import { TokenPayload } from "../models/commonTypes";

export const selectAll = async (): Promise<Array<Token>> => {
    const tokenRepository = getRepository(Token);
    return await tokenRepository.find();
};

export const selectPaginated = async (offset: number, limit: number): Promise<Array<Token>> => {
    return await getRepository(Token)
        .createQueryBuilder("token")
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