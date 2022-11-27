import { TRPCClientError } from '@trpc/client';
import axios from 'axios';
import moment from 'moment';
import { SetStateAction } from 'react';
import type { QueryBundle } from '@blockchain-carbon-accounting/data-postgres';
import type { Token, Tracker, Wallet, ProductToken, ProductTokenBalance } from '../components/static-data';
import type { EmissionsFactorForm } from '../pages/request-audit';
import { BASE_URL } from './api.config';
import { trpcClient } from './trpc'
import { getTotalEmissions } from '../components/tracker-info-modal'

axios.defaults.baseURL = BASE_URL;

function handleError(error: unknown, prefix: string) {
    const response = (error as any).response ?? error
    const data_error = response?.data?.error ?? response?.error ?? response?.data ?? response
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


export function handleFormErrors<F extends {}, E extends {}>(err: unknown, setFormErrors: (e: SetStateAction<E>) => void, setForm: (f: SetStateAction<F>) => void) {
  console.error(err)
  if (err instanceof TRPCClientError) {
    console.warn(err.data, err.message)
    let topLevelError = err?.data?.domainError
    if (err?.data?.zodError?.fieldErrors) {
      const fieldErrors = err.data.zodError.fieldErrors
      const errs: Partial<Record<keyof E, string>> = {};
      for (const f in fieldErrors) {
        errs[f as keyof E] = fieldErrors[f].join(', ')
      }
      setFormErrors(e=>{ return { ...e, ...errs} })
    } else if (err?.data?.domainErrorPath) {
      const errs: Partial<Record<keyof E, string>> = {};
      errs[err?.data?.domainErrorPath as keyof E] = err?.data?.domainError
      console.warn('Set field errors', errs)
      // here no need to repeat as toplevel error
      topLevelError = ''
      setFormErrors(e=>{ return { ...e, ...errs} })
    } else if (!topLevelError) {
      topLevelError = err?.message || 'An unexpected error occurred'
    }
    setForm(f=>{ return { ...f, loading: '', error: topLevelError } })
  } else {
    setForm(f=>{ return { ...f, loading: '', error: ("" + ((err as any)?.message || err) as any) } })
  }
}


export function buildBundlesFromQueries(query: string[]) {
    let bundles: QueryBundle[] = []
    query.forEach(elem => {
        const elems = elem.split(',')
        bundles.push({
            field: elems[0],
            fieldType: elems[1],
            value: elems[2],
            op: elems[3],
            conjunction: elems[4] === 'true'
        })
    });
    return bundles
}

export const getTokens = async (offset: number, limit: number, query: string[]): Promise<{count:number, tokens:Token[], status:string}> => {
    try {
        const bundles = buildBundlesFromQueries(query)
        console.info('getTokens:', offset, limit, bundles)
        const { status, count, tokens, error } = await trpcClient.query('token.list', {offset, limit, bundles})
        if (status === 'success' && tokens) {
            return { count, tokens, status }
        } else {
            if (status !== 'success') console.error('getTokens error:', error)
            return {count: 0, tokens: [], status};
        }
    } catch(error) {
        throw new Error(handleError(error, "Cannot get tokens"))
    }
}

export const setProductDetails = (tracker: Tracker, product:ProductToken) => {
    let metadata = product.metadata as any;
    // check for name, unit and unitAmount attributes from metadata
    product.name = metadata.name;
    product.unit = metadata.unit;
    product.unitAmount = Number(product.issued)
    product.unitAvailable = Number(product.available);
    product.emissionsFactor = tracker.emissionsFactor;
    product.unitConversion = 1;
    if(metadata.unitAmount){
        product.unitAmount = Number(metadata.unitAmount);
        product.unitConversion = Number(product.unitAmount)/Number(product.issued);
        product.unitAvailable = product.unitAvailable*product.unitConversion;
        product.emissionsFactor = tracker.emissionsFactor!/product.unitConversion; 
    }

    for(let i=0;i<product?.balances?.length!;i++){
        product.balances![i].unitAvailable=Number(product?.balances![i].available)*product.unitConversion
        tracker.myProductsTotalEmissions = tracker.myProductsTotalEmissions! + getTotalEmissions(tracker)*Number(product.balances![i]?.available!)/Number(tracker?.totalProductAmounts!);
    }
    //return product;
}

export const setTrackerDetails = (tracker: Tracker) => {
    tracker.myProductsTotalEmissions = 0;
    tracker.emissionsFactor = Number(tracker.totalEmissions-tracker.totalOffsets)/Number(tracker.totalProductAmounts);
    for(let i=0;i<tracker?.products?.length!;i++){
        setProductDetails(tracker, tracker?.products![i]);
    }
    //return tracker
}


export const getTrackers = async (offset: number, limit: number, query: string[], issuedTo: string, tokenTypeId: number): Promise<{count:number, trackers:Tracker[], status:string}> => {
    try {
        const bundles = buildBundlesFromQueries(query)
        console.info('getTrackers:', offset, limit, bundles, issuedTo, tokenTypeId)
        const { status, count, trackers, error } = await trpcClient.query('tracker.list', {offset, limit, bundles, issuedTo, tokenTypeId})
        if (status === 'success' && trackers && count) {
            for(let i=0;i<trackers?.length;i++){
                setTrackerDetails(trackers![i])
            }
            return { count, trackers, status }
        } else {
            if (status !== 'success') console.error('getTrackers error:', error)
            return {count: 0, trackers: [], status};
        }
    } catch(error) {
        throw new Error(handleError(error, "Cannot get trackers"))
    }
}

export const getTracker = async (trackerId:number): Promise<{tracker:Tracker|undefined, status:string}> => {
    try {
        console.info('getTracker:', trackerId)
        const { status, tracker, error } = await trpcClient.query('tracker.get', {trackerId})
        if (status === 'success' && tracker) {
            setTrackerDetails(tracker)
            return { tracker, status }
        } else {
            if (status !== 'success') console.error('getTracker error:', error)
            return {tracker: tracker, status};
        }
    } catch(error) {
        return {tracker: undefined, status: error as string}
        //throw new Error(handleError(error, "Cannot get tracker"))
    }
}

export const getProduct = async (productId:number): Promise<{product:ProductToken|undefined, status:string}> => {
    try {
        console.info('getProduct:', productId)
        const { status, product, error } = await trpcClient.query('productToken.get', {productId})
        if (status === 'success' && product) {
            const {tracker, status} = await getTracker(product.trackerId)
            setProductDetails(tracker!,product)
            return { product, status }
        } else {
            if (status !== 'success') console.error('getTracker error:', error)
            return {product, status};
        }
    } catch(error) {
        throw new Error(handleError(error, "Cannot get tracker"))
    }
}

export const getBalances = async (offset: number, limit: number, query: string[]) => {
    try {
        const bundles = buildBundlesFromQueries(query)
        console.info('getBalances:', offset, limit, bundles)
        const { status, count, balances, error } = await trpcClient.query('balance.list', {offset, limit, bundles})
        if (status === 'success' && balances) {
            return { count, balances, status }
        } else {
            if (status !== 'success') console.error('getBalances error:', error)
            return {count: 0, balances: [], status};
        }
    } catch(error) {
        throw new Error(handleError(error, "Cannot get balances"))
    }
}

export const getTrackerBalance = async (trackerId: number, issuedTo: string) => {
    try {
        console.info('getTrackerBalance:', trackerId, issuedTo)
        const { status, balance, error } = await trpcClient.query('trackerBalance.get', {trackerId, issuedTo})
        if (status === 'success' && balance) {
            return { balance, status }
        } else {
            if (status !== 'success') console.error('getTrackerBalance error:', error)
            return { status };
        }
    } catch(error) {
        throw new Error(handleError(error, "Cannot getTrackerBalance"))
    }
}

export const getProductBalance = async (productId: number, issuedTo: string) => {
    try {
        console.info('getProductBalance:', productId, issuedTo)
        const { status, balance, error } = await trpcClient.query('productTokenBalance.get', {productId, issuedTo})
        if (status === 'success' && balance) {
            const trackerBalance:ProductTokenBalance = balance
            trackerBalance.unitConversion = 1;
            const {status, product} = await getProduct(productId);
            if(status==='success'){
                trackerBalance.product = product as ProductToken;
                if(product?.unitAmount) trackerBalance.unitConversion = Number(product.unitAmount)/Number(product.issued);
            }else {
                if (status !== 'success') console.error('getProduct for ProductBalance error:', error)
                return { status };  
            }
            return { balance: trackerBalance, status }
        } else {
            if (status !== 'success') console.error('getProductBalance error:', error)
            return { status };
        }
    } catch(error) {
        throw new Error(handleError(error, "Cannot getProductBalance"))
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

export const requestPasswordReset = async(email:string) => {
  try {
    const { data } = await axios.post(`/request-password-reset/${email}`);
    console.log('requestPasswordReset response:', data);
    if(data.status === 'success') return data.wallet;
    else return null;
  } catch(error) {
    throw new Error(handleError(error, "Cannot request a password reset"))
  }
}

export const markPkExported = async(email: string, password: string) => {
  return trpcClient.mutation('wallet.markPkExported', {email, password})
}

export const changePassword = async(email: string, token: string, currentPassword: string, password: string, passwordConfirm: string) => {
  return trpcClient.mutation('wallet.changePassword', {email, token, currentPassword, password, passwordConfirm})
}

export const signInUser =  async(email:string, password:string) => {
  return trpcClient.mutation('wallet.signin', {email, password})
}

export const signUpUser =  async(captchaToken:string, email:string, password:string, passwordConfirm:string, name:string|undefined, organization:string|undefined) => {
  return trpcClient.mutation('wallet.signup', {captchaToken, email, password, passwordConfirm, name, organization})
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

export const createEmissionsRequest = async (form: EmissionsFactorForm, supportingDocument: File, signedInAddress: string, fromDate: Date|null, thruDate: Date|null, trackerId?: number|null) => {
    try {
        const url = BASE_URL + '/emissionsrequest/';
        const formData = new FormData();
        for (const k in form) {
            formData.append(k, form[k as keyof EmissionsFactorForm].toString());
        }
        formData.append("supportingDocument", supportingDocument);
        formData.append("signedInAddress", signedInAddress);
        if (fromDate) {
            formData.append("fromDate", (moment(fromDate)).format('YYYY-MM-DD HH:mm:ss.SSS'));
        }
        if (thruDate) {
            formData.append("thruDate", (moment(thruDate.setHours(23,59,59,999))).format('YYYY-MM-DD HH:mm:ss.SSS'));
        }
        if (trackerId) {
            formData.append("trackerId", trackerId.toString());
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

export const calculateEmissionsRequest = async (form: EmissionsFactorForm, fromDate: Date|null, thruDate: Date|null) => {
    try {
        const url = BASE_URL + '/calcemissionsrequest/';
        const formData = new FormData();
        for (const k in form) {
            formData.append(k, form[k as keyof EmissionsFactorForm]);
        }
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
