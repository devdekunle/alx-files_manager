import redisClient from '../utils/redis';
import dbClient from '../utils/db';
const mime = require('mime-types');
const { ObjectId } = require('mongodb');
const isbase64 = require('is-base64');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Queue = require('bull')
const fileQueue = new Queue('thumbnail generation');

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
      // get user from database
      const user = await dbClient.db.collection('users').findOne({ _id: new ObjectId(userId) });
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
      }
      // destructure request data
      const {
        name, type, data,
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
        parentId = new ObjectId(parentId);
      }
      if (!isPublic) {
        isPublic = false;
      }
      if (parentId !== 0) {
        // search for file with parentId if it exists if file ought to have a parentId
        const file = await dbClient.db.collection('files').findOne({ _id: parentId });
        if (!file) {
          res.status(400).json('Parent not found');
        } else if (file.type !== 'folder') {
          res.status(400).json('Parent is not a folder');
        }
      }
      // if file is a folder
      if (type === 'folder') {
        const newFile = await dbClient.db.collection('files').insertOne({
          name, type, parentId, userId: user._id, isPublic,
        });
        res.status(201).json({
          name, type, userId, isPublic, parentId, id: newFile.insertedId,
        });
        // create directory and write content to the file
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
        if (type === 'image') {
            // add a new job to the thumnail generation queue
            await fileQueue.add({ userId: user._id, fileId: newFile.insertedId });
        }

        res.status(201).json({
          id: newFile.insertedId, userId, name, type, isPublic, parentId,
        });
      }
    } catch (err) {
      console.log(err);
    }
  }

  static async getShow(req, res) {
    const fileId = req.params.id;
    try {
      // method to retrieve a file document based on its id

      // authenticate user from token
      const token = req.header('X-Token');
      if (!token) {
        res.status(400).json({ error: 'Unauthorized' });
      }
      // get userId vis token from redis
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
      }
      const user = await dbClient.db.collection('users').findOne({ _id: new ObjectId(userId) });
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
      }
      // retrieve file from database based on userId and id passed in paramaters
      const file = await dbClient.db.collection('files').findOne({ userId: new ObjectId(userId), _id: new ObjectId(fileId) });
      if (!file) {
        res.status(404).json({ error: 'Not found' });
      } else {
        res.status(200).json({
          id: file._id.toString(),
          name: file.name,
          userId,
          type: file.type,
          isPublic: file.isPublic,
          parentId: file.parentId.toString(),
        });
      }
    } catch (err) {
      console.log(err);
    }
  }

  static async getIndex(req, res) {
    // retrieve all files in the db for a specific parentId
    const token = req.header('X-Token');
    if (!token) {
      res.status(400).json({ error: 'Unauthorized' });
    }
    try {
    // get userId vis token from redis
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
      }
      const user = await dbClient.db.collection('users').findOne({ _id: new ObjectId(userId) });
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
      }
      // get query parameters
      const { parentId } = req.query;
      let { page } = req.query;
      if (!page || page < 1) page = 1;
      const perPage = 20;
      const skipCount = (page - 1) * perPage;
      if (!parentId || parentId === 0) {
        const files = await dbClient.db.collection('files').aggregate([
          {
            $skip: skipCount,
          },

          {
            $limit: perPage,
          },
          {
            $project: {
              localPath: 0,
            },
          },
        ]).toArray()
        res.status(200).json(files);
      } else {
        const files = await dbClient.db.collection('files').aggregate([
          {
            $match: { parentId: new ObjectId(parentId) },
          },

          {
            $skip: skipCount,
          },
          {
            $limit: perPage,
          },
          {
            $project: {
              localPath: 0,
            },
          },
        ]).toArray();
        res.status(200).json(files);
      }
    } catch (err) {
      console.log(err);
    }
  }

  static async putPublish(req, res) {
    // authenticate user
    const token = req.header('X-Token');
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
      }
      const user = await dbClient.db.collection('users').findOne({ _id: new ObjectId(userId) });
      if (!user) {
        res.status(404).json({ error: 'Not found' });
      }
      const fileId = req.params.id;
      const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(fileId), userId: user._id });
      if (!file) {
        res.status(404).json({ error: 'Not found' });
      }
      await dbClient.db.collection('files').updateOne({ _id: file._id },
        { $set: { isPublic: true } });
      res.status(200).json({
        id: file._id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: true,
        parentId: file.parentId,
      });
    } catch (err) {
      console.log(err);
    }
  }

  static async putUnpublish(req, res) {
    // authenticate user
    const token = req.header('X-Token');
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
      }
      const user = await dbClient.db.collection('users').findOne({ _id: new ObjectId(userId) });
      if (!user) {
        res.status(404).json({ error: 'Not found' });
      }
      const fileId = req.params.id;
      if (!fileId) {
        res.status(400).json({error: "fileId missing in query string"});
      }
      const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(fileId), userId: user._id });
      if (!file) {
        res.status(404).json({ error: 'Not found' });
      }
      await dbClient.db.collection('files').updateOne({ _id: file._id },
        { $set: { isPublic: false } });
      res.status(200).json({
        id: file._id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: false,
        parentId: file.parentId,
      });
    } catch (err) {
      console.log(err);
    }
  }

  static async getFile(req, res) {
    // method to retrieve the contents of a file
    // get token from header
    const token = req.header('X-Token');
    if (!token) {
        res.status(400).json({error: "Unauthorized"});
    }
    try {
        // get userId from redis
        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) {
            res.status(401).json({error: "Unauthorized"});
        }
        // get the fileId from request parameter
        const fileId = req.params.id;
        if (!fileId) {
            res.status(400).json({error: 'File is missing'})
        }
        // get the file from the database based on the fileId and userId
        const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(fileId), userId: new ObjectId(userId)})
        if (!file || file.isPublic === false) {
            res.status(404).json({error: "Not found"});
        }
        if (file.type === "folder") {
            res.status(400).json({error: "A folder doesn't have content"})
        }
        // check if file is present in disk using the fs module
        fs.access(file.localPath, fs.constants.F_OK, (err) => {
            if (err) {
                res.status(404).json({error: "Not found"})
            }
        });
        // get correct mime type for file
        const fileMimeType = mime.contentType(file.name)
        console.log(fileMimeType);
        if (fileMimeType) {
            fs.readFile(file.localPath, 'utf-8', (err,fileData) => {
                if (err) {console.log(err)}
                res.status(200).json(fileData);
            });
         }
     } catch (err) {
        console.log(err);
     }
  }
}
