import { Request, Response } from 'express';
import { WsIdentityClient } from 'ws-identity-client';
import { fabricConnector } from '../service/service';

export async function webSocket(req: Request, res: Response): Promise<void> {
    try {
        if (!fabricConnector.opts.webSocketConfig) {
            throw new Error(`WS-X.509 identity provider type has not been coinfigure`);
        }
        const wsIdentityBackend = new WsIdentityClient({
            apiVersion: 'v1',
            endpoint: fabricConnector.opts.webSocketConfig.endpoint,
            rpDefaults: {
                //    strictSSL: fabricConnector.opts.webSocketConfig.strictSSL !== false
            },
        });
        const { sessionId, url } = JSON.parse(
            await wsIdentityBackend.write(
                'session/new',
                {
                    pubKeyHex: req.headers.pub_key_hex,
                    keyName: req.query.userId,
                },
                {},
            ),
        );
        res.status(201).send({
            sessionId,
            url,
        });
    } catch (error) {
        res.status(error.status).json({
            msg: error.message,
        });
    }
}
