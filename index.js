const express = require("express");
const app = express();
const server = require("http").createServer(app);

const WebSocket = require("ws"); 


const wss = new WebSocket.Server({ server });

wss.on("connection", ws => {
    ws.send("You connected");
    ws.on("message", msg => {
        ws.send("You wrote: " + msg);
    });
});


server.listen(3000);
