import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this._redis = createClient();
    this._redis.on('error', (error) => {
      console.log(error);
    });
  }

  isAlive() {
    return this._redis.connected;
  }

  async get(key) {
    const getKey = promisify(this._redis.get).bind(this._redis);
    try {
      const value = await getKey(key);
      return value;
    } catch (error) {
      return null;
    }
  }

  async set(key, value, duration) {
    const setKey = promisify(this._redis.setex).bind(this._redis);
    try {
      setKey(key, duration, value);
    } catch (error) {
      console.log(error);
    }
  }

  async del(key) {
    try {
      this._redis.del(key);
    } catch (error) {
      console.log(error);
    }
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
