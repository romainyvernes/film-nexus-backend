import { Redis } from "ioredis";
import config from "./config";

const client = new Redis({
  host: config.redis.host,
  port: 6379,
  password: config.redis.password,
  family: 6,
});

export default client;
