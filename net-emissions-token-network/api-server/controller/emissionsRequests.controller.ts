import { Response, Request } from 'express';
import { PostgresDBService } from "blockchain-accounting-data-postgres/src/postgresDbService";
import { GroupedResult, issue_tokens, process_activity } from 'supply-chain-lib/src/emissions-utils' 
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


function getActivityType(body: any): 'shipment'|'flight'|'emissions_factor' {
  if (body.activity_type === 'shipment' || body.activity_type === 'flight' || body.activity_type === 'emissions_factor') return body.activity_type
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
    console.log('postEmissionsRequest request is', req.body)
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

    if (!req.body.issued_to && !req.body.signedInAddress) {
      return res.status(400).json({ status: 'failed', error: 'No address to issue to was given!' })
    }
    const issued_to = req.body.issued_to || req.body.signedInAddress;
    if (!req.body.issued_from) {
      return res.status(400).json({ status: 'failed', error: 'No address to issue from was given!' })
    }
    const issued_from = req.body.issued_from;

    // TODO: this is also required, use a dummy value for now
    const public_key = `-----BEGIN RSA PUBLIC KEY-----
MIICCgKCAgEAuW+kKey05FvD5fSsuLQ5+Oo20af49IpayOHjjjE6XXKF13gQDi09
SCO75UpkCtM1sa+dSWOIMb286a0+Qwu7ALGTyWsr4KOGt8XUchyTcOIyQ9bnJIO6
qOZIp8qvktnGJ3K2cX6x9pIrZ75sxt53kJkheBJpBK+7xnurW8NLEgBeRjH9yfKP
XI2ouFk7tnN4RC7YgXg1lKK/KARU+c9owZw+V45Gzm+GCsDT4oVnZdCWPNduZKcI
yvbexUIIcj0Sd1pOKWOxPwch6SfS+3DagqrUE08xPlmKJF6XZAMP1Ad3uTi1UNq9
DHO/4SzmI5NQdd012c3l6Xjca67slZlpPczcMUm2qW/9FeYJNsbjK6bpvjKwZFmh
yv2d6PjxxMNU58Ebqp1pkxFv4YbTVZccthYTZKMltQXA5ucsJOXQpakWeQL6M1p+
dKjIlaqN9RQ/GOfz/K4/jCs5DEjMG5cpfON81/0N2hJMYEiyWNJpqr68/v98tbym
jRnv4Bp9oCPe6rOFc36ovQVhNN9wNCYe5rYrDH1jYqtFpqa2/xi+Oin0YnWjhyC7
9sjDjQmCfPXcBdBEBfsMq+/yCZHrvL4M9JQNvLKmjjxRGsWLvTVPQBZWZI5VqfbX
unBhCxmS0/TCgl9LSIbNk96Uo2AwZPjPeNt+H1/LOQrfa5HuIFwGrVkCAwEAAQ==
-----END RSA PUBLIC KEY-----`;

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
    const queue_result = await issue_tokens(
      group,
      activity_type, 
      [public_key], 
      true, // queue
      JSON.stringify({
        issued_from,
        ...activity
      }), 
      undefined,
      issued_from,
      issued_to,
      true, // the pubkey is given inline instead of being a file name,
      supportingDocument.data
    );
    console.log('Queued request:', queue_result)

    return res.status(200).json({ status: 'success', queue_result, result });
  } catch (error) {
    console.error('postEmissionsRequest error: ', error);
    if (error instanceof ApplicationError) {
      return res.status(error.status).json({ status: 'failed', error })
    }
    return res.status(500).json({ status: 'failed', error });
  }
}

