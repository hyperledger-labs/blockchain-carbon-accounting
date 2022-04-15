import axios from 'axios';

export async function getEmissionsAuditors() {
  console.log("Get Emissions Auditors ...");
  try {
      const { data } = await axios.get(process.env.TOKEN_QUERY_SERVER_URL + '/wallets?bundles=roles,string,Emission+Auditor,like', {});
      if(data.status === 'success') return data.wallets;
      else return [];
  } catch(error) {
      throw new Error("cannot get emissions auditors from api server");
  }
}
