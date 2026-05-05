const Project = require('../models/Project');
const User = require('../models/User');

// @desc    Create a project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
  try {
    const { title, description } = req.body;

    const project = new Project({
      title,
      description,
      admin: req.user._id,
      members: [req.user._id] // Admin is implicitly a member
    });

    const createdProject = await project.save();
    res.status(201).json(createdProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all projects for logged-in user
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    // User can see projects where they are either admin or in the members array
    const projects = await Project.find({
      $or: [{ admin: req.user._id }, { members: req.user._id }]
    })
    .populate('admin', 'name email')
    .populate('members', 'name email');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single project with members & tasks
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('admin', 'name email')
      .populate('members', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Verify user is part of project
    const isMember = project.members.some(m => m._id.toString() === req.user._id.toString());
    const isAdmin = project.admin._id.toString() === req.user._id.toString();

    if (!isMember && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this project' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin: Add member by email
// @route   POST /api/projects/:id/members
// @access  Private/Admin
const addMember = async (req, res) => {
  try {
    const { email } = req.body;
    const project = req.project; // populated from roleMiddleware

    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    if (project.members.includes(userToAdd._id)) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    project.members.push(userToAdd._id);
    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('admin', 'name email')
      .populate('members', 'name email');

    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin: Remove member
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private/Admin
const removeMember = async (req, res) => {
  try {
    const project = req.project; // populated from roleMiddleware
    const { userId } = req.params;

    if (project.admin.toString() === userId) {
      return res.status(400).json({ message: 'Cannot remove the admin from the project' });
    }

    project.members = project.members.filter(m => m.toString() !== userId);
    await project.save();

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createProject, getProjects, getProjectById, addMember, removeMember };
