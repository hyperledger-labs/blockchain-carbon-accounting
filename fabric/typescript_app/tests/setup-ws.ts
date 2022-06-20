import { WsWallet } from 'ws-wallet';
import { IWebSocketKey } from '../src/blockchain-gateway-lib/I-gateway';
import { WsIdentityClient } from 'ws-identity-client';

async function setupWebSocket(keyName: string): Promise<IWebSocketKey> {
    const wsWalletAdmin = new WsWallet({
        keyName,
    });
    const wsIdClient = new WsIdentityClient({
        apiVersion: 'v1',
        endpoint: process.env.WS_IDENTITY_ENDPOINT,
        rpDefaults: {
            strictSSL: false,
        },
    });
    const { sessionId, url } = JSON.parse(
        await wsIdClient.write(
            'session/new',
            {
                pubKeyHex: wsWalletAdmin.getPubKeyHex(),
                keyName: wsWalletAdmin.keyName,
            },
            {},
        ),
    );
    return await wsWalletAdmin.open(sessionId, url);
}

export { setupWebSocket };
