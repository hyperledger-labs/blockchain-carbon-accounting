import type { Request, Response } from 'express';
import { Router } from 'express';
import { insertNewAsset } from '../controller/asset.controller';

const router = Router();

router.get('/ip', (request: Request, response: Response) => response.send(request.ip))

router.post('/assets', insertNewAsset)

export default router;
