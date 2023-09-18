import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const { ObjectId } = require('mongodb');

const isBase64 = require('is-base64');

const sha1 = require('sha1');
const { v4: uuidv4 } = require('uuid');

class AuthController {
  static async getConnect(req, res) {
    // login a user with a token
    try {
      // get request header
      const header = req.header('Authorization');
      if (!header) {
        res.status(401).json({ error: 'Unauthorized' });
      }
      const base64AuthToken = header.split(' ')[1];

      if (!base64AuthToken || !isBase64(base64AuthToken)) {
        res.status(401).json({ error: 'Unauthorized' });
      }
      const bufferObj = Buffer.from(base64AuthToken, 'base64');
      const userData = bufferObj.toString('utf-8').split(':');
      const hashPassword = sha1(userData[1]);
      const user = await dbClient.db.collection('users').findOne({ email: userData[0], password: hashPassword });
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
      } else {
        const token = uuidv4();
        await redisClient.set(`auth_${token}`, user._id.toString(), 86400000);
        res.status(200).json({ token });
      }
    } catch (err) {
      console.log(err);
    }
  }

  static async getDisconnect(req, res) {
    // sign out a user based on the token
    try {
      const xToken = req.header('X-Token');
      if (!xToken) {
        res.status(401).json({ error: 'Unauthorized' });
      }
      const userId = await redisClient.get(`auth_${xToken}`);
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
      }
      const user = await dbClient.db.collection('users').findOne({ _id: new ObjectId(userId) });
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
      } else {
        await redisClient.del(`auth_${xToken}`);
        res.status(204).end();
      }
    } catch (err) {
      console.log(err);
    }
  }
}
module.exports = AuthController;
