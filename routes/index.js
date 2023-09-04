/*
    module that uses the router middleware to define routes
*/
// import controller from AppController module
import AppController from '../controllers/AppController';

const router = require('express').Router();

// define routes for middleware
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

module.exports = router; // export middleware instance
