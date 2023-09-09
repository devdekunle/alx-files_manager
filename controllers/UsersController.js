import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const { ObjectId } = require('mongodb');

const sha1 = require('sha1');

class UsersController {
  static async postNew(req, res) {
    // get json data from req.body
    const { email, password } = req.body;

    if (!email) {
      res.status(400).send({ error: 'Missing email' });
    }
    if (!password) {
      res.status(400).send({ error: 'Missing password' });
    }
    try {
      const userEmail = await dbClient.db.collection('users').findOne({ email });
      if (userEmail) {
        res.status(400).send({ error: 'Already exist' });
      } else {
        const newPasswordHash = sha1(password);
        const result = await dbClient.db.collection('users').insertOne({ email, password: newPasswordHash });
        res.status(201).send({ email, id: result.insertedId });
      }
    } catch (err) {
      console.log(err);
    }
  }

  static async getMe(req, res) {
    try {
      const authToken = req.header('X-Token');
      if (!authToken) {
        res.status(401).send({ error: 'Unauthorized' });
      }
      const userId = await redisClient.get(`auth_${authToken}`);
      if (!userId) {
        res.status(401).send({ error: 'Unauthorized' });
      }
      const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
      if (!user) {
        res.status(401).send({ error: 'Unauthorized' });
      } else {
        res.status(200).send({ email: user.email, id: user._id });
      }
    } catch (err) {
      console.log(err);
    }
  }
}
module.exports = UsersController;
