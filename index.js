const server = require("https").createServer();
const io = require("socket.io")(server);
io.on("connection", client => {
  client.on("event", data => { /* … */ });
  client.on("disconnect", () => { /* … */ });
  client.emit("proba", "Proba 1-2-3");
});
server.listen(3000);