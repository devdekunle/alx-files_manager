import redisClient from '../utils/redis';
import dbClient from '../utils/db';
const { ObjectId } = require('mongodb');
const isbasic64 = require('is-base64');

export default class FilesController {
  static async  postUpload(req, res) {
        // authenticate user via token from X-Token header
        const token = req.header('X-Token');
        if (!token) {
            res.status(401).send({error: "Unauthorized"})
        }
        try {
        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) {
            res.status(401).send({error: "Unauthorized"});
        }
        const user = await dbClient.db.collect('users').findOne({ _id: ObjectId(userId) });
        if (!user) {
            res.status.send({ error: "Unauthorized" });
        }
        const { name, type, parentId, isPublic, data } = req.body;

        if (!name) {
            req.status(400).send("Missing name");
        }

        if (!type || type !== "file" || type !== "folder" || type !== "image") {
            res.status.(400).send("Missing type")
        }
        if (type !== "folder" && !data  ) {
            res.status.(400).send("Missing data");
        }
        if (!parentId) {
            parentId = 0;
        }
        if (!isPublic) {
            isPublic = false;
        }


    }
}
}
