import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static getStatus(req, res) {
    if (redisClient.isAlive() && dbClient.isAlive()) {
      res.statusCode = 200;
      res.json({ redis: true, db: true });
    }
  }

  static async getStats(req, res) {
    res.statusCode = 200;
    const userCount = await dbClient.nbUsers();
    const fileCount = await dbClient.nbFiles();
    res.json({ users: userCount, files: fileCount });
  }
}
module.exports = AppController;
