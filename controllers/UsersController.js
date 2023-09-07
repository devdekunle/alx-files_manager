import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const { v4: uuidv4 } = require('uuid');
const sha1 = require('sha1');

class UsersController {
  static async postNew(req, res) {
    if (dbClient.isAlive()) {
    // get json data from req.body
      const jsonData = req.body;
      const { email } = jsonData;
      const { password } = jsonData;

      if (!email) {
        res.status(400).send({ error: 'Missing email' });
      }
      if (!password) {
        res.status(400).send({ error: 'Missing password' });
      }
      try {
        const userEmail = await dbClient.db.collection('users').find({ email }).toArray();
        if (userEmail.length === 1) {
          res.status(400).send({ error: 'Already exist' });
        } else {
          const newPasswordHash = sha1(password);
          const result = await dbClient.db.collection('users').insertOne({ email, password: newPasswordHash });
          res.status(201).send({ email, id: result.insertedId });
        }
      } catch (err) {
        console.log(err);
      }
    } else {
      console.log('Not connected to mongodb database');
    }
  }

  static async getMe(req, res) {
    try {
      const authToken = req.header('X-Token');
      if (!authToken) {
        res.status(401).send({ error: 'Unauthorized' });
      }
      const userId = await redisClient.get(`auth_${authToken}`);
      const user = await dbClient.db.collection('users').find({ _id: userId }).toArray();
      if (user.length === 0) {
        res.status(401).send({ error: 'Unauthorized' });
      } else {
        res.status(200).send({ email: user[0].email, id: user[0]._id });
      }
    } catch (err) {
      res.status(401).send({ error: 'Unauthorized' });
    }
  }
}
module.exports = UsersController;
