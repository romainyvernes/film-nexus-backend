export default (io) => {
  io.on("connection", (socket) => {
    socket.on("new message", (msg) => {
      socket.broadcast.emit("new message", msg);
    });

    socket.on("delete message", (msg) => {
      socket.broadcast.emit("delete message", msg);
    });

    socket.on("new file", (file) => {
      socket.broadcast.emit("new file", file);
    });

    socket.on("update file", (file) => {
      socket.broadcast.emit("update file", file);
    });

    socket.on("delete file", (file) => {
      socket.broadcast.emit("delete file", file);
    });
  });
};
