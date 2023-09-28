import FilesController from '../controllers/FilesController';
import AuthController from '../controllers/AuthController';
import UsersController from '../controllers/UsersController';
import AppController from '../controllers/AppController';
/*
module that uses the router middleware to define routes
*/
// import controller from AppController module

const express = require('express');
const cors = require('cors');

const router = express.Router();

// define routes for middleware
router.use(cors());
router.use(express.json());
// for parsing application/json
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UsersController.postNew);
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe);
router.post('/files', FilesController.postUpload);
router.get('/files/:id', FilesController.getShow);
router.get('/files', FilesController.getIndex);
router.put('/files/:id/publish', FilesController.putPublish);
router.put('/files/:id/unpublish', FilesController.putUnpublish);
router.get('/files/:id/data', FilesController.getFile);
module.exports = router;
// export middleware instance
