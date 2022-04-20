import { Response, Request } from 'express';
import { PostgresDBService } from "blockchain-accounting-data-postgres/src/postgresDbService";

export async function decline_emissions_request(uuid: string) {
  const db = await PostgresDBService.getInstance()
  const emissions_request = await db.getEmissionsRequestRepo().selectEmissionsRequest(uuid);
  if (emissions_request) {
    // check status is correct
    if (emissions_request.status == 'PENDING') {
      await db.getEmissionsRequestRepo().updateToDeclined(uuid);
    } else {
      throw new Error(`Emissions request status is ${emissions_request.status}, expected PENDING`);
    }
  } else {
    throw new Error(`Cannot get emissions request ${uuid}`);
  }
}


export async function get_auditor_emissions_requests(auditor: string) {
  const db = await PostgresDBService.getInstance()
  return await db.getEmissionsRequestRepo().selectByEmissionAuditor(auditor);
}

export async function count_auditor_emissions_requests(auditor: string) {
  const db = await PostgresDBService.getInstance()
  return await db.getEmissionsRequestRepo().countByEmissionAuditor(auditor);
}

export async function get_auditor_emissions_request(uuid: string) {
  const db = await PostgresDBService.getInstance()
  return await db.getEmissionsRequestRepo().selectEmissionsRequest(uuid);
}

export async function declineEmissionsRequest(req: Request, res: Response) {
  try {
    await decline_emissions_request(req.params.uuid);
  } catch (error) {
    return res.status(500).json({ status: 'failed', error });
  }
  return res.status(200).json({ status: 'success' });
}

export async function getEmissionsRequests(req: Request, res: Response) {
  try {
    const items = await get_auditor_emissions_requests(req.params.auditor);
    return res.status(200).json({ status: 'success', items });
  } catch (error) {
    return res.status(500).json({ status: 'failed', error });
  }
}

export async function countEmissionsRequests(req: Request, res: Response) {
  if (req.params.op == 'count') {
    try {
      const count = await count_auditor_emissions_requests(req.params.auditor);
      return res.status(200).json({ status: 'success', count });
    } catch (error) {
      return res.status(500).json({ status: 'failed', error });
    }
  } else {
    return res.status(200).json({error: 'Wrong operation'});
  }
}

export async function getEmissionsRequest(req: Request, res: Response) {
  try {
    const item = await get_auditor_emissions_request(req.params.uuid);
    return res.status(200).json({ status: 'success', item });
  } catch (error) {
    return res.status(500).json({ status: 'failed', error });
  }
}

