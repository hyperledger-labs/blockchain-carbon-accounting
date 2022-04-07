import axios from 'axios';

const BASE_URL = "http://localhost:8000";
axios.defaults.baseURL = BASE_URL;

export const getTokens = async (offset, limit, query) => {
    try {
        var params = new URLSearchParams();
        params.append('offset', offset);
        params.append('limit', limit);
        query.forEach(elem => {
            params.append('bundles', elem);
        });
        const { data } = await axios.get('/tokens', {
            params
        });
        if(data.status === 'success') {
            return data;
        } else {
            return [];
        }
    } catch (error) {
        throw new Error("cannot get count from api server");
    }
}

export const getBalances = async (offset, limit, query) => {
    try {
        var params = new URLSearchParams();
        params.append('offset', offset);
        params.append('limit', limit);
        query.forEach(elem => {
            params.append('bundles', elem);
        });
        const { data } = await axios.get('/balances', {
            params
        });
        if(data.status === 'success') return data;
        else return [];
    } catch(error) {
        throw new Error("cannot get balances from api server");
    }
}

export const registerUserRole = async (address, name, organization, public_key, public_key_name, roles) => {
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

export const unregisterUserRole = async (address, roles) => {
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
        throw new Error("cannot get balances from api server");
    }
}
