import { PostgresDBService } from '@blockchain-carbon-accounting/data-postgres';
import { Request, Response } from 'express';
import { checkSignedMessage, getRoles } from '../controller/synchronizer';


export const handleSignedMessage = async (req: Request, res: Response) => {
  try {
    const message = req.body.message;
    const signature = req.body.signature;
    console.log('signedMessage received:', signature, message)
    const account = checkSignedMessage(message, signature, req.context.opts)
    if (!account) {
      throw "Failed to verify signature!"
    }
    console.log('signedMessage was from account:', account)
    const data = JSON.parse(message)
    console.log('signedMessage data:', data)
    const db = await PostgresDBService.getInstance()
    // if it is the same account, just save the data
    // else check the roles, and only allow admin to updaet (for example)
    if (account != data.address) {
      const roles = await getRoles(account, req.context.opts)
      if (!roles.isAdmin) {
        throw "Must be Admin to update other users info"
      }
    }
    const wallet = await db.getWalletRepo().mergeWallet({...data});

    return res.status(200).json({
      status: 'success',
      wallet
    });
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      status: 'failed',
      error
    });
  }
}
