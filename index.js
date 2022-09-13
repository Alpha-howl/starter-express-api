const io = require("socket.io")(3000);

io.on("connection", socket => {
    socket.emit("proba", "Proba 1-2-3");
});