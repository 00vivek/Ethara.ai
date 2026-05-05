const express = require('express');
const router = express.Router();
const { createTask, getTasksByProject, updateTask, deleteTask } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { checkProjectAdmin } = require('../middleware/roleMiddleware');

router.route('/')
  .post(protect, checkProjectAdmin, createTask);

router.route('/project/:id')
  .get(protect, getTasksByProject);

router.route('/:id')
  .put(protect, updateTask)
  .delete(protect, deleteTask); // Manual admin check in controller

module.exports = router;
