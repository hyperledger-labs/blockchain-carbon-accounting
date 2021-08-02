import {config} from 'dotenv';
import express,{Express,json,urlencoded,RequestHandler} from 'express';
import LedgerIntegration from './src/blockchain-gateway/ledger-integration';
import {serve,setup} from 'swagger-ui-express';
import swaggerDocs from './swagger.json';
import multer from 'multer';

const env = process.env.NODE_ENV;
if (env){
    const cfgOut = config({path:`.env.${env}`});
    if (cfgOut.error){
        console.error(cfgOut.error);
        process.exit(1);
    }
    console.log(`using ${env} ethereum network`);
}else{
    config();
}



const app:Express = express();
const upload = multer();
const PORT = process.env.PORT || 9000;

app.use(json() as RequestHandler);
app.use(urlencoded({extended: true}));
app.use(upload.single('emissionsDoc'));

const ledgerIntegration = new LedgerIntegration(app);
// swagger Document
app.use('/api-docs',serve,setup(swaggerDocs));
ledgerIntegration.build()
.then(()=>{
    app.listen(PORT,()=>{
        console.log(`++++++++++++++++ Hyperledger CA2 SIG /// Carbon Accouncting API ++++++++++++++++`);
        console.log(`++ REST API PORT : ${PORT}`);
        console.log(`++ ACCESS SWAGGER : http://localhost:${PORT}/api-docs/`);
        console.log(`++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++`);
    });
})
.catch((error)=>{
    console.error('failed to build ledger Integration : %o',error);
});