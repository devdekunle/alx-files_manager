import { createClient } from 'redis';
import { promisify } from 'util';
class RedisClient {
    constructor() {
        this.isReady = false;
        this._redis = createClient()
        this.isReady = true;
        this._redis.on('error', (error) => {
            console.log(error)
        });
    }
     async isAlive() {
        return this.isReady;
     }
    async get(key) {
        const getKey = promisify(this._redis.get).bind(this._redis);
        return getKey(key)
    }
    async set(key, value, duration) {
        const setKey = promisify(this._redis.set).bind(this._redis);
        return setKey(key, value, 'EX', duration)
    }
    async del(key) {
        const delKey = promisify(this._redis.del).bind(this._redis);
        return delKey(key);
    }
}

const redisClient = new RedisClient()
module.exports = redisClient;
