// SPDX-License-Identifier: Apache-2.0
import axios from 'axios';

export async function getTestRequest(url: string) {
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
