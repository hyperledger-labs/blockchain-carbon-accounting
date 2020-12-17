import axios from 'axios';

export async function getTestRequest(url) {
    let result;
    try {
        result = await axios({
            url: url
        });
    } catch (error) {
        result = error;
    }
    return result;
}
