import { Request, Response } from 'express';
import { utilityEmissionsChannelService } from '../service/service';

export async function recordEmission(req: Request, res: Response): Promise<void> {
    try {
        let file: Buffer;
        if (req.file) {
            file = req.file.buffer;
        }
        const record = await utilityEmissionsChannelService.recordEmission({
            body: req.body,
            header: req.headers,
            query: req.query,
            file: file,
        });
        res.status(201).json(record);
    } catch (error) {
        res.status(error.status).json({
            msg: error.message,
        });
    }
}

export async function getEmissionsData(req: Request, res: Response): Promise<void> {
    try {
        const record = await utilityEmissionsChannelService.getEmissionsData({
            body: req.body,
            header: req.headers,
            query: req.query,
            params: req.params,
        });
        res.status(200).json(record);
    } catch (error) {
        res.status(error.status).json({
            msg: error.message,
        });
    }
}

export async function getAllEmissionsData(req: Request, res: Response): Promise<void> {
    try {
        const record = await utilityEmissionsChannelService.getAllEmissionsData({
            body: req.body,
            header: req.headers,
            query: req.query,
            params: req.params,
        });
        res.status(200).json(record);
    } catch (error) {
        res.status(error.status).json({
            msg: error.message,
        });
    }
}

export async function getAllEmissionsDataByDateRange(req: Request, res: Response): Promise<void> {
    try {
        const record = await utilityEmissionsChannelService.getAllEmissionsDataByDateRange({
            body: req.body,
            header: req.headers,
            query: req.query,
            params: req.params,
        });
        res.status(200).json(record);
    } catch (error) {
        res.status(error.status).json({
            msg: error.message,
        });
    }
}

export async function recordAuditedEmissionsToken(req: Request, res: Response): Promise<void> {
    try {
        const record = await utilityEmissionsChannelService.recordAuditedEmissionsToken({
            body: req.body,
            header: req.headers,
            query: req.query,
            params: req.params,
        });
        res.status(200).json(record);
    } catch (error) {
        res.status(error.status).json({
            msg: error.message,
        });
    }
}
