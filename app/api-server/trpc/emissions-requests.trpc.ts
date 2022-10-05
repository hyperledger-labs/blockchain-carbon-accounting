import * as trpc from '@trpc/server'
import { z } from 'zod'
import { count_auditor_emissions_requests, decline_emissions_request, get_auditor_emissions_request, get_auditor_emissions_requests, issue_emissions_request } from '../controller/emissionsRequests.controller';
import { TrpcContext } from './common';

export const emissionsRequestsRouter = (zQueryBundles:any) => trpc
.router<TrpcContext>()
.query('count', {
    input: z.object({
        auditor: z.string(),
    }),
    async resolve({ input }) {
        try {
            const count = await count_auditor_emissions_requests(input.auditor);
            return { status: 'success', count }
        } catch (error) {
            console.error(error)
            return { status: 'failed', error }
        }
    },
})
.query('list', {
    input: z.object({
        auditor: z.string(),
    }),
    async resolve({ input }) {
        try {
            const items = await get_auditor_emissions_requests(input.auditor);
            return { status: 'success', items }
        } catch (error) {
            console.error(error)
            return { status: 'failed', error }
        }
    },
})
.query('getById', {
    input: z.object({
        uuid: z.string(),
    }),
    async resolve({ input }) {
        try {
            const item = await get_auditor_emissions_request(input.uuid);
            return { status: 'success', item }
        } catch (error) {
            console.error(error)
            return { status: 'failed', error }
        }
    },
})
.mutation('decline', {
    input: z.object({
        uuid: z.string(),
    }),
    async resolve({ input }) {
        try {
            await decline_emissions_request(input.uuid);
            return { status: 'success' }
        } catch (error) {
            console.error(error)
            return { status: 'failed', error }
        }
    },
})
.mutation('issue', {
    input: z.object({
        uuid: z.string(),
    }),
    async resolve({ input }) {
        try {
            await issue_emissions_request(input.uuid);
            return { status: 'success' }
        } catch (error) {
            console.error(error)
            return { status: 'failed', error }
        }
    },
})

// export type definition of API
export type EmissionsRequestsRouter = typeof emissionsRequestsRouter


