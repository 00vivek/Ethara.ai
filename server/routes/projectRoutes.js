const express = require('express');
const router = express.Router();
const { createProject, getProjects, getProjectById, addMember, removeMember } = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');
const { checkProjectAdmin } = require('../middleware/roleMiddleware');

router.route('/')
  .post(protect, createProject)
  .get(protect, getProjects);

router.route('/:id')
  .get(protect, getProjectById);

router.route('/:id/members')
  .post(protect, checkProjectAdmin, addMember);

router.route('/:id/members/:userId')
  .delete(protect, checkProjectAdmin, removeMember);

module.exports = router;
