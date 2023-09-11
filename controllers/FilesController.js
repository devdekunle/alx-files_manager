import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const { ObjectId } = require('mongodb');
const isbase64 = require('is-base64');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

export default class FilesController {
  static async postUpload(req, res) {
    // authenticate user via token from X-Token header
    const token = req.header('X-Token');
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
      }
      const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
      }
      const {
        name, type, data
        } = req.body;
      let { parentId, isPublic } = req.body;

      if (!name) {
        req.status(400).json('Missing name');
      }

      if (!type || (type !== 'file' && type !== 'folder' && type !== 'image')) {
        res.status(400).json('Missing type');
      }
      if (type !== 'folder' && !data) {
        res.status(400).json('Missing data');
      }
      if (type !== 'folder' && !(isbase64(data))) {
        res.status(400).json('data must be a base64 of data');
      }
      if (!parentId) {
        parentId = 0;
      } else {
        parentId = ObjectId(parentId);
      }
      if (!isPublic) {
        isPublic = false;
      }
      if (parentId !== 0) {
        const file = await dbClient.db.collection('files').findOne({ _id: parentId });
        if (!file) {
          res.status(400).json('Parent not found');
        } else if (file.type !== 'folder') {
          res.status(400).json('Parent is not a folder');
        }
      }
      if (type === 'folder') {
        const newFile = await dbClient.db.collection('files').insertOne({
          name, type, parentId, userId: user._id,
        });
        res.status(201).json({
          name, type, userId, isPublic, parentId, id: newFile.insertedId,
        });
      } else if (type === 'file' || type === 'image') {
        const base64Data = Buffer.from(data, 'base64');
        const fileData = base64Data.toString('utf-8');
        const directoryPath = process.env.FOLDER_PATH || '/tmp/files_manager';
        const fileName = uuidv4();
        const fileLocalPath = `${directoryPath}/${fileName}`;
        fs.mkdir(directoryPath, { recursive: true }, (err) => {
          if (err) {
            console.log(`Error when creating directory ${err}`);
          } else {
            fs.writeFile(fileLocalPath, fileData, (err) => {
              if (err) console.log(err);
              console.log(`${fileLocalPath} has been created`);
            });
          }
        });
        const newFile = await dbClient.db.collection('files').insertOne({
          name, type, parentId, isPublic, userId: user._id, localPath: fileLocalPath,
        });
        res.status(201).json({
          id: newFile.insertedId, userId, name, type, isPublic, parentId,
        });
      }
    } catch (err) {
      console.log(err);
    }
  }
}
