import express, { Application } from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
dotenv.config({path: '../.env'});

// import router
import { router as keyRouter } from './app/routers/router';

const app: Application = express();
const PORT: number | string = process.env.REST_API_PORT || 5000;

// middleware setting
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.post('/issue', keyRouter);

app.delete('/emissionsrequest/:uuid', keyRouter);

app.listen(PORT, () => {
    console.log(`Server is listening on ${PORT}`);
});
