import axios from 'axios';

const BASE_URL = "http://localhost:8000";
axios.defaults.baseURL = BASE_URL;

export const getTokens = async (offset, limit, query) => {
    try {
        const { data } = await axios.get('/tokens', {
            params: {
                offset,
                limit,
                bundles: query
            }
        });
        if(data.status === 'success') {
            return data.tokens;
        } else {
            return [];
        }
    } catch (error) {
        throw new Error("cannot get count from api server");
    }
}

export const getNumOfTokens = async (bundles) => {
    try {
        const { data } = await axios.get('/tokens/count', {
            params: {bundles}
        });
        if(data.status === 'success') {
            return data.count;
        } else {
            return 0;
        }
    } catch (error) {
        throw new Error("cannot get count from api server");
    }
}

export const getBalances = async (offset, limit, query) => {
    try {
        const { data } = await axios.get('/balances', {
            params: {
                offset, limit, bundles: query
            }
        });
        if(data.status === 'success') return data.balances;
        else return [];
    } catch(error) {
        throw new Error("cannot get balances from api server");
    }
}

export const getNumOfBalances = async (bundles) => {
    try {
        const { data } = await axios.get('/balances/count', {
            params: {bundles}
        });
        if(data.status === 'success') {
            return data.count;
        } else {
            return 0;
        }
    } catch (error) {
        throw new Error("cannot get count from api server");
    }
}
