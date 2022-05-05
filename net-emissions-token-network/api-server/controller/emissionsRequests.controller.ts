import moment from 'moment';
import { Response, Request } from 'express';
import { PostgresDBService } from "blockchain-accounting-data-postgres/src/postgresDbService";
import { GroupedResult, process_activity, queue_issue_tokens } from 'supply-chain-lib/src/emissions-utils' 
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

export async function issue_emissions_request(uuid: string) {
  const db = await PostgresDBService.getInstance()
  const emissions_request = await db.getEmissionsRequestRepo().selectEmissionsRequest(uuid);
  if (emissions_request) {
    // check status is correct
    if (emissions_request.status == 'PENDING') {
      await db.getEmissionsRequestRepo().updateToIssued(uuid);
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

export async function issueEmissionsRequest(req: Request, res: Response) {
  try {
    await issue_emissions_request(req.params.uuid);
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getActivityType(body: any): 'shipment'|'flight'|'emissions_factor' {
  if (body.activity_type === 'shipment' || body.activity_type === 'flight' || body.activity_type === 'emissions_factor') return body.activity_type
  throw new ApplicationError(`Unsupported activity type: ${body.activity_type}`, 400)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getActivity(body: any): Activity {
  const activity_type = getActivityType(body)

  if (activity_type === 'shipment') {
    // make a shipment activity
    return {
      id: '1',
      type: activity_type,
      carrier: body.carrier || (body.ups_tracking ? 'ups' : 'unknown'),
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
  } else if (activity_type === 'emissions_factor') {
    return {
      id: '1',
      type: activity_type,
      emissions_factor_uuid: body.emissions_factor_uuid,
      number_of_passengers: Number(body.num_passengers),
      weight: Number(body.weight),
      weight_uom: body.weight_uom,
      distance: Number(body.distance),
      distance_uom: body.distance_uom,
      activity_amount: Number(body.activity_amount),
      activity_uom: body.activity_uom,
    }
  }
  throw new ApplicationError(`Unsupported activity type.` , 400)
}

export async function postEmissionsRequest(req: Request, res: Response) {
  try {
    console.log('postEmissionsRequest...')
    const db = await PostgresDBService.getInstance()
    // check the supporting document was uploaded, note: ignore ts-error in the test container
    // @ts-ignore
    let supportingDocument = req.files?.supportingDocument;
    if (!supportingDocument) {
      return res.status(400).json({ status: 'failed', error: 'No supporting document was uploaded!' })
    }
    console.log('postEmissionsRequest checking file', supportingDocument)
    if (Array.isArray(supportingDocument)) {
      if (supportingDocument.length !== 1) {
        return res.status(400).json({ status: 'failed', error: 'Can only upload one supporting document!' })
      }
      supportingDocument = supportingDocument[0];
    }

    if (!req.body.issued_to && !req.body.signedInAddress) {
      return res.status(400).json({ status: 'failed', error: 'No address to issue to was given!' })
    }
    const issued_to = req.body.issued_to || req.body.signedInAddress;
    const issued_from = req.body.issued_from;

    // build an Activity object to pass to supply-chain processActivity
    // we also do some validation here
    const activity = getActivity(req.body)
    if (!activity) {
      return res.status(400).json({ status: 'failed', error: 'Bad activity inputs!' })
    }
    const result = await process_activity(activity);
    console.log('Processed activity:', result)
    const total_emissions = result.emissions?.amount;
    const activity_type = activity.type;
    if (!total_emissions) {
      return res.status(400).json({ status: 'failed', error: 'Could not get the total emissions for the activity!' })
    }
    const group: GroupedResult = {
      total_emissions,
      content: [{
        activity,
        result
      }],
    }
    if (req.body.fromDate) {
      group.from_date = moment(req.body.fromDate, 'YYYY-MM-DD HH:mm:ss.SSS').toDate();
    }
    if (req.body.thruDate) {
      group.thru_date = moment(req.body.thruDate, 'YYYY-MM-DD HH:mm:ss.SSS').toDate();
    }

    const queue_result = await queue_issue_tokens(
      group,
      activity_type,
      undefined, // mode
      issued_from,
      issued_to,
    );
    console.log('Queued request:', queue_result)

    // associate the uploaded file
    const emissions_request_id = queue_result.request.uuid;
    const uploaded_file = await db.getFileRepo().insert({
      name: supportingDocument.name,
      size: supportingDocument.size
    })
    const emissions_request = await db.getEmissionsRequestRepo().selectEmissionsRequest(emissions_request_id)
    if (!emissions_request) {
      return res.status(400).json({ status: 'failed', error: 'Unexpected error retrieving the emissions request!' })
    }
    await db.getEmissionsRequestRepo().addSupportingDocument(emissions_request, uploaded_file)

    // do something with it ?
    console.log(`postEmissionsRequest moving to upload folder as ${uploaded_file.uuid} ...`)
    supportingDocument.mv((process.env.DOC_UPLOAD_PATH || './upload/') + uploaded_file.uuid);

    const allresp = { status: 'success', queue_result, result };
    return res.status(200).send(JSON.stringify(allresp, (_, v) => typeof v === 'bigint' ? v.toString() : v));
  } catch (error) {
    console.error('postEmissionsRequest error: ', error);
    if (error instanceof ApplicationError) {
      return res.status(error.status).json({ status: 'failed', error })
    }
    return res.status(500).json({ status: 'failed', error:  (error as Error).message });
  }
}

