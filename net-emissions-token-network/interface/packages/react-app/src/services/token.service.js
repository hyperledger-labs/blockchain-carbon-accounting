import axios from 'axios';

const BASE_URL = "http://localhost:8000";
axios.defaults.baseURL = BASE_URL;

export const getTokens = async () => {
    try {
        const { data } = await axios.get('/tokens');
        if(data.status === 'success') {
            return data.tokens;
        } else {
            return [];
        }
    } catch (error) {
        throw new Error("cannot get count from api server");
    }
}

export const getNumOfTokens = async () => {
    try {
        const { data } = await axios.get('/count');
        if(data.status === 'success') {
            return data.count;
        } else {
            return 0;
        }
    } catch (error) {
        throw new Error("cannot get count from api server");
    }
}
