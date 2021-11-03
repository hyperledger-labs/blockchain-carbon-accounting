# Client for web-socket identity servers

This is a node.js client to connect with the web-socket identity server [ws-identity](../ws-identity/README.md).


## Requesting new session Id 
  - Submit pubKeyHex to socket server and receive ws-identity session ticket
```typescript
  const wsSessionBackend = new WsIdentityClient({
    endpoint: [ws-server-address],
    pathPrefix: "/session",
  });
const sessionId = wsSessionBackend.write("new",{pubKeyHex: [pub-key-hex]});
```