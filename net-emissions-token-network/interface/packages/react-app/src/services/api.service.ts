import axios from 'axios';
import moment from 'moment';
import type { QueryBundle } from '../../../../../../data/postgres/src/repositories/common';
import type { Token, Wallet } from '../components/static-data';
import type { EmissionsFactorForm } from '../pages/request-audit';
import { BASE_URL } from './api.config';
import { trpcClient } from './trpc'

axios.defaults.baseURL = BASE_URL;

function handleError(error: unknown, prefix: string) {
    const response = (error as any).response ?? error
    const data_error = response?.data?.error ?? response?.error ?? response
    console.error('Error response has data?:', data_error)
    let errMsg = prefix
    if (data_error) {
        if (data_error.name === 'ApplicationError' || data_error.message) {
            errMsg += ': ' + data_error.message
        } else {
            errMsg += `:\n ${JSON.stringify(data_error,null,2)}`

        }
    }
    console.error(`handleError: ${prefix} -->`, errMsg)
    return errMsg;
}


function buildBundlesFromQueries(query: string[]) {
    let bundles: QueryBundle[] = []
    query.forEach(elem => {
        const elems = elem.split(',')
        bundles.push({
            field: elems[0],
            fieldType: elems[1],
            value: elems[2],
            op: elems[3],
        })
    });
    return bundles
}

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
        throw new Error(handleError(error, "Cannot get tokens"))
    }
}

export const getBalances = async (offset: number, limit: number, query: string[]) => {
    try {
        const bundles = buildBundlesFromQueries(query)
        console.info('getBalances:', offset, limit, bundles)
        const list = await trpcClient.query('balance.list', {offset, limit, bundles})
        console.info('getBalances result:', list)
        if (list.status === 'success' && list.balances) {
            return { count: list.count, balances: list.balances }
        } else {
            if (list.status !== 'success') console.error('getBalances error:', list.error)
            return {count: 0, balances: []};
        }
    } catch(error) {
        throw new Error(handleError(error, "Cannot get balances"))
    }
}

export const postSignedMessage = async (message: string, signature: string) => {
    try {
        var params = {
            message,
            signature
        };
        const { data } = await axios.post('/signedMessage', params);
        console.log('postSignedMessage response:', data);
        if(data.status === 'success') return data;
        else return [];
    } catch(error) {
        throw new Error(handleError(error, "Cannot post the signed message"))
    }
}

/**
 * This is the function to create wallet with mail and password by calling API Server
 * @param mailAddress
 * @param password
 */
 export const signUpUser =  async(mailAddress:string, password:string):Promise<Wallet|null> => {
    try {
        var params = {
            mailAddress,
            password
        };
        const {data} = await axios.post('/sign-up', params);
        console.log('singUpUser response: ', data);
        if(data.status === 'success') return data.wallet;
        else return null;
    } catch(error){
        throw new Error(handleError(error, "Cannot Sign Up this user"))
    }
}

/**
 * This is the function to login with mail and password by calling API Server
 * @param mailAddress
 * @param password
 */
export const signInUser =  async(mailAddress:string, password:string):Promise<Wallet|null> => {
    try{
        var params = {
            mailAddress,
            password
        };
        const {data} = await axios.post('/sign-in', params);
        console.log('signInUser response: ', data);
        if(data.status === 'success') return data.wallet;
        else return null;
    } catch (error){
        throw new Error(handleError(error, "Cannot SignIn"))
    }
}

export const registerUserRole = async (address: string, name: string, organization: string, public_key: string, public_key_name: string, roles: string): Promise<Wallet|null> => {
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
        if(data.status === 'success') return data.wallet;
        else return null;
    } catch(error) {
        throw new Error(handleError(error, "Cannot register user role"))
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
        else return {};
    } catch(error) {
       throw new Error(handleError(error, "Cannot unregister user role"))
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
        throw new Error(handleError(error, "Cannot get wallets"))
    }
}

export const countAuditorEmissionsRequests = async (auditor: string): Promise<number> => {
    try {
        const data = await trpcClient.query('emissionsRequests.count', {auditor})
        if (data.status === 'success' && data.count) return data.count
        else return 0;
    } catch(error) {
        throw new Error(handleError(error, "Cannot count auditor emissions requests"))
    }
}

export const getAuditorEmissionsRequests = async (auditor: string) => {
    try {
        const data = await trpcClient.query('emissionsRequests.list', {auditor})
        if (data.status === 'success' && data.items) return data.items
        else return [];
    } catch(error) {
        throw new Error(handleError(error, "Cannot get auditor emissions requests"))
    }
}

export const getAuditorEmissionsRequest = async (uuid: string) => {
    try {
        const data = await trpcClient.query('emissionsRequests.getById', {uuid})
        if (data.status === 'success' && data.item) {
          return data.item;
        } else {
          throw new Error("Cannot get auditor emissions request");
        }
    } catch(error) {
        throw new Error(handleError(error, "Cannot get auditor emissions request"))
    }
}

export const declineEmissionsRequest = async (uuid: string) => {
    try {
        const data = await trpcClient.mutation('emissionsRequests.decline', {uuid})
        if (data.status === 'success') {
          return data;
        } else {
          throw new Error("Cannot decline emissions request");
        }
    } catch(error) {
        throw new Error(handleError(error, "Cannot decline emissions request"))
    }
}

export const issueEmissionsRequest = async (uuid: string) => {
    try {
        const data = await trpcClient.mutation('emissionsRequests.issue', {uuid})
        if (data && data.status === 'success') {
          return data;
        } else {
          throw new Error("Cannot issue emissions request");
        }
    } catch(error) {
        throw new Error(handleError(error, "Cannot issue emissions request"))
    }
}

export const createEmissionsRequest = async (form: EmissionsFactorForm, supportingDocument: File, signedInAddress: string, fromDate: Date|null, thruDate: Date|null) => {
    try {
        const url = BASE_URL + '/emissionsrequest/';
        const formData = new FormData();
        for (const k in form) {
            formData.append(k, form[k as keyof EmissionsFactorForm]);
        }
        formData.append("supportingDocument", supportingDocument);
        formData.append("signedInAddress", signedInAddress);
        if (fromDate) {
            formData.append("fromDate", (moment(fromDate)).format('YYYY-MM-DD HH:mm:ss.SSS'));
        }
        if (thruDate) {
            formData.append("thruDate", (moment(thruDate.setHours(23,59,59,999))).format('YYYY-MM-DD HH:mm:ss.SSS'));
        }
        const resp = await fetch(url, {
            method: 'POST',
            body: formData,
        });
        const data = await resp.json();
        if (data.status === 'success') {
            return data;
        } else {
            throw data;
        };
    } catch(error) {
        throw new Error(handleError(error, "Cannot create emissions request"))
    }
}
