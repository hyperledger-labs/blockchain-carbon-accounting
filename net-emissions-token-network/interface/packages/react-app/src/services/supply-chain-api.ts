import axios from 'axios';

export const BASE_URL = "http://localhost:5000";

export const countAuditorEmissionsRequests = async (auditor: string): Promise<number> => {
    try {
        const url = BASE_URL + '/emissionsrequests/' + auditor + '/count';
        const { data } = await axios.get(url, {});
        if(data.success) return data.count;
        else return 0;
    } catch(error) {
        throw new Error("cannot count auditor emissions requests");
    }
}
