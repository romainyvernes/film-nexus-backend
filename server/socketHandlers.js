import { default as redis } from "./redis";

export default (io) => {
  io.on("connection", (socket) => {
    socket.on("new message", async (msg) => {
      // clear messages and total count to avoid inaccurate data
      const messageRedisKey = `projects:${msg.project_id}:messages`;
      const countRedisKey = `${messageRedisKey}:count`;
      await redis.del([messageRedisKey, countRedisKey]);

      socket.broadcast.emit("new message", msg);
    });

    socket.on("delete message", async (msg) => {
      // clear messages and total count to avoid inaccurate data
      const messageRedisKey = `projects:${msg.project_id}:messages`;
      const countRedisKey = `${messageRedisKey}:count`;
      await redis.del([messageRedisKey, countRedisKey]);

      socket.broadcast.emit("delete message", msg);
    });

    socket.on("new file", async (file) => {
      // clear files and total count to avoid inaccurate data
      const fileRedisKey = `projects:${file.project_id}:files`;
      const countRedisKey = `${fileRedisKey}:count`;
      await redis.del([fileRedisKey, countRedisKey]);

      socket.broadcast.emit("new file", file);
    });

    socket.on("update file", async (file) => {
      // clear files and total count to avoid inaccurate data
      const fileRedisKey = `projects:${file.project_id}:files`;
      const countRedisKey = `${fileRedisKey}:count`;
      await redis.del([fileRedisKey, countRedisKey]);

      socket.broadcast.emit("update file", file);
    });

    socket.on("delete file", async (file) => {
      // clear files and total count to avoid inaccurate data
      const fileRedisKey = `projects:${file.project_id}:files`;
      const countRedisKey = `${fileRedisKey}:count`;
      await redis.del([fileRedisKey, countRedisKey]);

      socket.broadcast.emit("delete file", file);
    });
  });
};
