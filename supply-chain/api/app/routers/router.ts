import express, { Router } from 'express';
import multer from 'multer';
import { issueToken,
  declineEmissionsRequest,
  issueEmissionsRequest,
  getEmissionsRequests
} from '../controllers/controller';

const router: Router = express.Router();
const upload = multer({dest: './keys'});

router
    .route('/issue')
    .post(upload.fields([
        {
            name: 'keys'
        },{
            name: 'input'
        }
    ]), issueToken);

router.delete('/emissionsrequest/:uuid', declineEmissionsRequest);
router.put('/emissionsrequest/:uuid', issueEmissionsRequest);
router.get('/emissionsrequests/:auditor', getEmissionsRequests);

export { router };
