import axios from 'axios';
import { EmissionsRequest } from '../components/static-data';

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

export const getAuditorEmissionsRequests = async (auditor: string): Promise<EmissionsRequest[]> => {
    try {
        const url = BASE_URL + '/emissionsrequests/' + auditor;
        const { data } = await axios.get(url, {});
        if(data.success) return data.items;
        else return [];
    } catch(error) {
        throw new Error("cannot get auditor emissions requests");
    }
}

export const getAuditorEmissionsRequest = async (uuid: string): Promise<EmissionsRequest> => {
    try {
        const url = BASE_URL + '/emissionsrequest/' + uuid;
        const { data } = await axios.get(url, {});
        if(data.success) {
          return data.item;
        } else {
          throw new Error("cannot get auditor emissions requests");
        };
    } catch(error) {
        throw new Error("cannot get auditor emissions requests");
    }
}

export const declineEmissionsRequest = async (uuid: string) => {
    try {
        const url = BASE_URL + '/emissionsrequest/' + uuid;
        const { data } = await axios.delete(url, {});
        if(data.success) {
          return data;
        } else {
          throw new Error("cannot decline emissions request");
        };
    } catch(error) {
        throw new Error("cannot decline emissions request");
    }
}

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
