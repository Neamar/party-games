/* A quite detailed WebSockets example */

import uWS from "uWebSockets.js";
import { getGameById } from './game.js';
const port = parseInt(process.env.PORT || "") || 9001;

const app = uWS
  ./*SSL*/ App({
    key_file_name: "misc/key.pem",
    cert_file_name: "misc/cert.pem",
    passphrase: "1234",
  })
  .ws("/:gameId", {
    /* Options */
    compression: uWS.SHARED_COMPRESSOR,
    maxPayloadLength: 16 * 1024 * 1024,
    idleTimeout: 10,
    /* Handlers */
    upgrade: (res, req, context) => {
      res.upgrade(
        { gameId: req.getParameter((0)) }, // pass path to ws object
        req.getHeader('sec-websocket-key'),
        req.getHeader('sec-websocket-protocol'),
        req.getHeader('sec-websocket-extensions'), // 3 headers are used to setup websocket
        context // also used to setup websocket
      )
    },
    open: (ws) => {
      console.log("A WebSocket connected!");
      getGameById(ws.gameId).addConnection(ws);
    },
    message: (ws, message, isBinary) => {
      const decodedMessage = Buffer.from(message).toString();
      getGameById(ws.gameId).receive(decodedMessage);
    },
    drain: (ws) => {
      console.log("WebSocket backpressure: " + ws.getBufferedAmount());
    },
    close: (ws, code, message) => {
      console.log("WebSocket closed");
      getGameById(ws.gameId).removeConnection(ws);
    },
  })
  .any("/", (res, req) => {
    // const game = req.getParameter((0));
    res.end(`
<script>
const exampleSocket = new WebSocket("ws://localhost:9001/123456");
exampleSocket.onmessage = (event) => {
  document.write(event.data + '<br>');
};
exampleSocket.onopen = (event) => {
  exampleSocket.send("coucou la forme")
};
</script>
`);
  })
  .listen(port, (token) => {
    if (token) {
      console.log("Listening to port " + port);
    } else {
      console.log("Failed to listen to port " + port);
    }
  });
