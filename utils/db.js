const { MongoClient } = require('mongodb');

const { DB_HOST } = process.env;
const { DB_PORT } = process.env;
const { DB_DATABASE } = process.env;

class DBClient {
  constructor() {
    this.host = 'localhost';
    if (DB_HOST) this.host = DB_HOST;
    this.port = '27017';
    if (DB_PORT) this.port = DB_PORT;
    this.database = 'files_manager';
    if (DB_DATABASE) this.database = DB_DATABASE;
    const url = `mongodb://${this.host}:${this.port}/${this.database}`;
    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.client.connect();
  }

  isAlive() {
    return this.client.topology.isConnected();
  }

  async nbUsers() {
    try {
      const collection = this.client.db().collection('users');
      const count = await collection.countDocuments();
      return count;
    } catch (err) {
      console.error(err);
      return -1;
    }
  }

  async nbFiles() {
    try {
      const collection = this.client.db().collection('files');
      const count = await collection.countDocuments();
      return count;
    } catch (err) {
      console.error(err);
      return -1;
    }
  }
}
const dbClient = new DBClient();
export default dbClient;
