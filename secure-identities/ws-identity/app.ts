import { config } from 'dotenv';
import express, { Application, Request, Response } from "express";
import bodyParser from "body-parser";
import { WsIdentityRouter } from './src/router';
import https from 'https'
import http from 'http'
const app: Application = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.get("/", (req: Request, res: Response) => {
  res.send("TS App is Running")
});
config();
const port = process.env.WEB_SOCKET_SERVER_PORT || '8700';

let protocol = 'http:'
let server
try{
  if(process.env.SSL_KEY && process.env.SSL_CERT){
    const credentials = {
      key: process.env.SSL_KEY,
      cert: process.env.SSL_CERT
    };
    server = https.createServer(credentials, app);  
    protocol = 'https:'
  }else{
     server = http.createServer(app);
  }
}catch(error){
    throw new Error(`error starting server: ${error}`);
}

server.listen(port, () => {
  console.log(`WS-IDENTITY server open at ${protocol}//localhost:${port}`)
})

const wsMount=process.env.WS_IDENTITY_PATH || '/sessions';

new WsIdentityRouter({
  app,
  server,
  wsMount,
  logLevel: 'debug'
});

app._router.stack.forEach(print.bind(null, []))

function print (path, layer) {
  if (layer.route) {
    layer.route.stack.forEach(print.bind(null, path.concat(split(layer.route.path))))
  } else if (layer.name === 'router' && layer.handle.stack) {
    layer.handle.stack.forEach(print.bind(null, path.concat(split(layer.regexp))))
  } else if (layer.method) {
    console.log('%s /%s',
      layer.method.toUpperCase(),
      path.concat(split(layer.regexp)).filter(Boolean).join('/'))
  }
}

function split (thing) {
  if (typeof thing === 'string') {
    return thing.split('/')
  } else if (thing.fast_slash) {
    return ''
  } else {
    var match = thing.toString()
      .replace('\\/?', '')
      .replace('(?=\\/|$)', '$')
      .match(/^\/\^((?:\\[.*+?^${}()|[\]\\\/]|[^.*+?^${}()|[\]\\\/])*)\$\//)
    return match
      ? match[1].replace(/\\(.)/g, '$1').split('/')
      : '<complex:' + thing.toString() + '>'
  }
}



