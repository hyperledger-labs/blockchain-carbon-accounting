import express, { Application } from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

import { subscribeEvents } from './components/synchronizer';

dotenv.config();

const app: Application = express();
const PORT: number | string = process.env.PORT || 8000;

// run event listener
subscribeEvents();

// middleware setting
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({extended: true}));

// router
app.use('/', () => {

});


app.listen(PORT, () => {
    console.log(`Server is listening on ${PORT}`)
});