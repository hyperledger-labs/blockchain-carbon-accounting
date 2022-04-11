import axios from 'axios';
import { Balance, Token, Wallet } from '../components/static-data';

const BASE_URL = "http://localhost:8000";
axios.defaults.baseURL = BASE_URL;

export const getTokens = async (offset: number, limit: number, query: string[]): Promise<{count:number, tokens:Token[], status:string}> => {
    try {
        var params = new URLSearchParams();
        params.append('offset', offset.toString());
        params.append('limit', limit.toString());
        query.forEach(elem => {
            params.append('bundles', elem);
        });
        const { data } = await axios.get('/tokens', { params });
        if(data.status === 'success') {
            return data;
        } else {
            return {count:0, tokens:[], status:'error'};
        }
    } catch (error) {
        throw new Error("cannot get count from api server");
    }
}

export const getBalances = async (offset: number, limit: number, query: string[]): Promise<{count: number, balances: Balance[]}> => {
    try {
        var params = new URLSearchParams();
        params.append('offset', offset.toString());
        params.append('limit', limit.toString());
        query.forEach(elem => {
            params.append('bundles', elem);
        });
        const { data } = await axios.get('/balances', {
            params
        });
        if(data.status === 'success') return data;
        else return {count: 0, balances: []};
    } catch(error) {
        throw new Error("cannot get balances from api server");
    }
}

export const registerUserRole = async (address: string, name: string, organization: string, public_key: string, public_key_name: string, roles: string) => {
    try {
        var params = {
            address,
            name,
            organization,
            public_key,
            public_key_name,
            roles
        };
        const { data } = await axios.post('/wallets', params);
        console.log('registerUserRole response:', data);
        if(data.status === 'success') return data;
        else return [];
    } catch(error) {
        throw new Error("cannot get balances from api server");
    }
}

export const unregisterUserRole = async (address: string, roles: string) => {
    try {
        var params = {
            address,
            roles
        };
        const { data } = await axios.post('/wallets', params);
        console.log('unregisterUserRole response:', data);
        if(data.status === 'success') return data;
        else return [];
    } catch(error) {
        throw new Error("cannot get response from api server");
    }
}

export const lookupWallets = async (query: string): Promise<Wallet[]> => {
    try {
        var params = new URLSearchParams();
        params.append('query', query);
        const { data } = await axios.get('/wallets', { params });
        console.log('lookupWallets response:', data, params, query);
        if(data.status === 'success') return data.wallets;
        else return [];
    } catch(error) {
        throw new Error("cannot get wallets from api server");
    }
}
