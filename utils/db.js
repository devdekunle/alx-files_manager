const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    const url = 'mongodb+srv://devdekunle:adekunle9102@letshare.ps7luan.mongodb.net/?retryWrites=true&w=majority';
    this.client = new MongoClient(url);
    this.client.connect();
    this.db = this.client.db('files_manager');

  }

    isAlive() {
    return true
  }

  async nbUsers() {
    try {
      const count = await this.client.db.collection('users').countDocuments();
      return count;
    } catch (err) {
      console.error(err);
      return -1;
    }
  }

  async nbFiles() {
    try {
    const count = await this.client.db.collection('files').countDocuments();
      return count;
    } catch (err) {
      console.error(err);
      return -1;
    }
  }
}
const dbClient = new DBClient();
export default dbClient;
