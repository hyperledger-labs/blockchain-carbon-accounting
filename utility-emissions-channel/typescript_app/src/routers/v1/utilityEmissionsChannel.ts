import { Router } from 'express';
import {
    recordEmission,
    getEmissionsData,
    getAllEmissionsData,
    getAllEmissionsDataByDateRange,
    recordAuditedEmissionsToken,
} from '../../controllers/utilityEmissionsChannel';

const router = Router();

router.post('/recordEmissions', recordEmission);
router.get('/getEmissionsData/:uuid', getEmissionsData);
router.get('/getAllEmissionsData/:utilityId/:partyId', getAllEmissionsData);
router.get('/getAllEmissionsDataByDateRange/:fromDate/:thruDate', getAllEmissionsDataByDateRange);
router.post('/recordAuditedEmissionsToken', recordAuditedEmissionsToken);

export default router;
