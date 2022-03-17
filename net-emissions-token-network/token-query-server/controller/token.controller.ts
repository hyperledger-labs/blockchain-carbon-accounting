import { Token } from "../models/token.model";
import { TokenPayload } from "../models/commonTypes";
import { selectAll, insert } from "../repositories/token";

export async function getTokens() : Promise<Array<Token>> {
    return selectAll();
}

export async function insertNewToken(token: TokenPayload): Promise<Token> {
    return insert(token);
}