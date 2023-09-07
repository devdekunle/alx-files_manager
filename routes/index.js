/*
    module that uses the router middleware to define routes
*/
// import controller from AppController module
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';

const express = require('express');
const router = express.Router();

// define routes for middleware
router.use(express.json()); // for parsing application/json
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UsersController.postNew);
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe);
module.exports = router; // export middleware instance
