import dbClient from '../utils/db';

const crypto = require('crypto');

class UsersController {
  static async postNew(req, res) {
    if (dbClient.isAlive()) {
    // get json data from req.body
      const jsonData = req.body;
      const { email } = jsonData;
      const { password } = jsonData;

      if (!email) {
        res.status(400).send({ error: 'Missing email' });
      } else if (!password) {
        res.status(400).send({ error: 'Missing password' });
      }
      try {
        const userEmail = await dbClient.db.collection('users').find({ email }).toArray();
        if (userEmail.length === 1) {
          res.status(400).send({ error: 'Already exist' });
        } else {
          const hash = crypto.createHash('sha1');
          const passwordHash = hash.update(password, 'utf-8');
          const newPasswordHash = passwordHash.digest('hex');
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
}
module.exports = UsersController;
