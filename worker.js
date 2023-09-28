// create a Queue instance and process the Queue
const fs = require('fs')
import dbClient from './utils/db';
const Queue = require('bull');
const imageThumbnail = require('image-thumbnail');

// create a queue
const fileQueue = new Queue('thumbnail generation');

// process the queue

fileQueue.process(async (job, done) => {
    try {
    if (!job.data.fileId) done(new Error('Missing fileId'));
    if(!job.data.userId) done(new Error('Missing userId'));
    const file = await dbClient.db.files.findOne({ userId: job.data.userId,
        fileId: job.data.fileId});
    if (!file) done(new Error('File not found'));
    // generate three image thumbnails
    const thumbnailWidth200 = await imageThumbnail(file.name, { width: 500 });
    const thumbnailWidth250 = await imageThumbnail(file.name, { width: 250 });
    const thumbnailWidth500 = await imageThumbnail(file.name, { width: 200 });
    fs.writeFile(`${file.localPath}_200`, thumbnailWidth200, (err) => {
        if (err) {
            console.log(err)
        }
    });
    fs.writeFile(`${file.localPath}_500`, thumbnailWidth500, (err) => {
        if (err) {
            console.log(err)
        }
    });
    fs.writeFile(`${file.localPath}_250`, thumbnailWidth250, (err) => {
        if (err) {
            console.log(err)
        }
    })

    } catch (err) {
        console.log(err);
    }
})
