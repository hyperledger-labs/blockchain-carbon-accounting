import  {
    LogLevelDesc,
    LoggerProvider,
} from '@hyperledger/cactus-common'
import express from "express";
import { WsWalletRouter } from "./router"

const app = express();

const PORT = +process.env.APP_PORT || 9090;
const logLevel = process.env.APP_LOG_LEVEL as LogLevelDesc || 'INFO';
const appLogger = LoggerProvider.getOrCreate({
  label: 'APPLICATION',
  level: logLevel,
})

app.listen(PORT, async () => {
    appLogger.info(
        `++++++++++++++++ ws-wallet API ++++++++++++++++`,
    );
    appLogger.info(`++ REST API PORT : ${PORT}`);
    //appLogger.info(`++ ACCESS SWAGGER : http://localhost:${this.PORT}/`);
    appLogger.info(
        `++++++++++++++++++++++++++++++++++++++++++++++++`,
    );
});
const wsWalletRouter = new WsWalletRouter({
    logLevel: 'debug'
});
app.use(express.json())
app.use(
    '/session/',
    wsWalletRouter.router
)

app._router.stack.forEach(print.bind(null, []))

function print (path, layer) {
  if (layer.route) {
    layer.route.stack.forEach(print.bind(null, path.concat(split(layer.route.path))))
  } else if (layer.name === 'router' && layer.handle.stack) {
    layer.handle.stack.forEach(print.bind(null, path.concat(split(layer.regexp))))
  } else if (layer.method) {
    console.log('%s /%s',
      layer.method.toUpperCase(),
      path.concat(split(layer.regexp)).filter(Boolean).join('/')
    )
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