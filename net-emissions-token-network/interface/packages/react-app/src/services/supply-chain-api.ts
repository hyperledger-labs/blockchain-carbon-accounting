import axios from 'axios';

export const BASE_URL = "http://localhost:5000";


export const issueEmissionsRequest = async (uuid: string) => {
    try {
        const url = BASE_URL + '/emissionsrequest/' + uuid;
        const { data } = await axios.put(url, {});
        if(data.success) {
          return data;
        } else {
          throw new Error("cannot issue emissions request");
        };
    } catch(error) {
        throw new Error("cannot issue emissions request");
    }
}
