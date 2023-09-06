/*
    module that uses the router middleware to define routes
*/
// import controller from AppController module
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';

const router = require('express').Router();

// define routes for middleware
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UsersController.postNew);
module.exports = router; // export middleware instance
