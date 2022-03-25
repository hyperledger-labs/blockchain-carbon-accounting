import { getRepository, InsertResult, SelectQueryBuilder } from "typeorm";
import { Balance } from "../models/balance.model";
import { QueryBundle, BalancePayload } from "../models/commonTypes";
import { Token } from "../models/token.model";
import { buildQueries } from './base.repo';

export const insert = async (payload: BalancePayload): Promise<InsertResult> => {
    // const balance = new Balance();
    return await getRepository(Balance)
        .createQueryBuilder('balance')
        .insert()
        .into(Balance)
        .values(payload)
        .execute();
}

export const selectBalance = async (issuee: string, tokenId: number): Promise<Array<Balance>> => {
    try {
        return await getRepository(Balance)
            .createQueryBuilder('balance')
            .where("balance.tokenId = :tokenId", {tokenId})
            .andWhere('LOWER(balance.issuee) = LOWER(:issuee)', {issuee})
            .getMany();
    } catch (error) {
        throw new Error('cannot select one');
    }
}

export const selectPaginated = async (offset: number, limit: number, bundles: Array<QueryBundle>) : Promise<Array<Balance>> => {
    try {
        let selectBuilder: SelectQueryBuilder<Balance> = getRepository(Balance).createQueryBuilder('balance');
        selectBuilder = buildQueries('balance', selectBuilder, bundles);
        return selectBuilder    
            .limit(limit)
            .offset(offset)
            .orderBy('balance.tokenId', 'ASC')
            .leftJoinAndMapOne('balance.token', Token, 'token', 'token.tokenId = balance.tokenId')
            .getMany();
    } catch (error) {
        console.log(error);
        throw new Error('Cannot select balances.');
    }
}

export const truncateBalances = async () => {
    await getRepository(Balance)
        .createQueryBuilder('balance')
        .delete()
        .execute();
}

export const addAvailableBalance = async (issuee: string, tokenId: number, amount: number) => {
    try {
        await getRepository(Balance)
            .createQueryBuilder('balance')
                .update(Balance)
                .set({available: () => `balance.\"available\" + ${amount}`})
                .where("tokenId = :tokenId", {tokenId})
                .andWhere('LOWER(issuee) = LOWER(:issuee)', {issuee})
                .execute();
    } catch (error) {
        throw new Error(`Cannot add ${tokenId} available balance ${amount} to ${issuee}`);
    }
}

export const transferBalance = async (issuee: string, tokenId: number, amount: number) => {
    try {
        await getRepository(Balance)
            .createQueryBuilder('balance')
                .update(Balance)
                .set({
                    available: () => `balance.\"available\" - ${amount}`,
                    transferred: () => `balance.\"transferred\" + ${amount}`
                })
                .where("tokenId = :tokenId", {tokenId})
                .andWhere('LOWER(issuee) = LOWER(:issuee)', {issuee})
                .execute();
    } catch (error) {
        throw new Error(`Cannot deduct ${tokenId} available balance ${amount} from ${issuee}`);
    }
}

export const retireBalance = async (issuee: string, tokenId: number, amount: number) => {
    try {
        await getRepository(Balance)
            .createQueryBuilder('balance')
                .update(Balance)
                .set({
                    available: () => `balance.\"available\" - ${amount}`,
                    retired: () => `balance.\"retired\" + ${amount}`
                })
                .where("tokenId = :tokenId", {tokenId})
                .andWhere('LOWER(issuee) = LOWER(:issuee)', {issuee})
                .execute();
    } catch (error) {
        throw new Error(`Cannot add ${tokenId} retired balance ${amount} to ${issuee}`);
    }
}

export async function count(bundles: Array<QueryBundle>): Promise<number> {
    try {
        let selectBuilder: SelectQueryBuilder<Balance> = getRepository(Balance).createQueryBuilder("balance");
        selectBuilder = buildQueries('balance', selectBuilder, bundles);
        return selectBuilder.getCount();
    } catch (error) {
        throw new Error("Cannot get balances count.");       
    }
}