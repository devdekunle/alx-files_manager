const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    this.client = new MongoClient(process.env.MONGODB_CONNECTION_STRING);
    this.client.connect();
    this.db = this.client.db('files_manager');

  }

    isAlive() {
    return true
  }

  async nbUsers() {
    try {
      const count = await this.db.collection('users').countDocuments();
      return count;
    } catch (err) {
      console.error(err);
      return -1;
    }
  }

  async nbFiles() {
    try {
    const count = await this.db.collection('files').countDocuments();
      return count;
    } catch (err) {
      console.error(err);
      return -1;
    }
  }
}
const dbClient = new DBClient();
export default dbClient;
