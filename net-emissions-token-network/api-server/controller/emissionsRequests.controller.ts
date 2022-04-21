import { Response, Request } from 'express';
import { PostgresDBService } from "blockchain-accounting-data-postgres/src/postgresDbService";
import { process_activity } from 'supply-chain-lib/src/emissions-utils' 
import { Activity } from 'supply-chain-lib/src/common-types';
import { ApplicationError } from '../utils/errors';

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


function getActivityType(body: any): 'shipment'|'flight' {
  if (body.activity_type === 'shipment' || body.activity_type === 'flight') return body.activity_type
  throw new ApplicationError(`Unsupported activity type: ${body.activity_type}`, 400)
}

function getActivity(body: any): Activity {
  const activity_type = getActivityType(body)

  if (activity_type === 'shipment') {
    // make a shipment activity
    return {
      id: '1',
      type: activity_type,
      carrier: body.ups_tracking?'ups':(body.carrier||'unknown'),
      tracking: body.ups_tracking || body.tracking_number || 'unknown',
      mode: body.shipment_mode,
      weight: Number(body.weight),
      weight_uom: body.weight_uom,
      from: {
        address: body.from_address
      },
      to: {
        address: body.destination_address
      }
    }
  } else if (activity_type === 'flight') {
    // make a flight activity
    return {
      id: '1',
      type: activity_type,
      flight_number: body.flight_number||'unknown',
      carrier: body.flight_carrier||'unknown',
      class: body.flight_service_level,
      number_of_passengers: Number(body.num_passengers),
      from: {
        address: body.from_address
      },
      to: {
        address: body.destination_address
      }
    }
  }
  throw new ApplicationError(`Unsupported activity type.` , 400)
}

export async function postEmissionsRequest(req: Request, res: Response) {
  try {
    console.log('postEmissionsRequest...')
    // check the supporting document was uploaded
    if (!req.files || !req.files.supportingDocument) {
      return res.status(400).json({ status: 'failed', error: 'No supporting document was uploaded!' })
    }
    let supportingDocument = req.files.supportingDocument;
    console.log('postEmissionsRequest checking file', supportingDocument)
    if (Array.isArray(supportingDocument)) {
      if (supportingDocument.length !== 1) {
        return res.status(400).json({ status: 'failed', error: 'Can only upload one supporting document!' })
      }
      supportingDocument = supportingDocument[0];
    }
    // do something with it ?
    // console.log('postEmissionsRequest moving to upload folder...')
    // supportingDocument.mv('./upload/' + supportingDocument.name);

    // build an Activity object to pass to supply-chain processActivity
    // we also do some validation here
    const activity = getActivity(req.body)
    if (!activity) {
      return res.status(400).json({ status: 'failed', error: 'Bad activity inputs!' })
    }
    const result = await process_activity(activity);
    console.log('Processed activity:', result)


    console.log('postEmissionsRequest rest of the body?...', result)


    return res.status(200).json({ status: 'success', result });
  } catch (error) {
    console.error('postEmissionsRequest error: ', error);
    if (error instanceof ApplicationError) {
      return res.status(error.status).json({ status: 'failed', error })
    }
    return res.status(500).json({ status: 'failed', error });
  }
}

