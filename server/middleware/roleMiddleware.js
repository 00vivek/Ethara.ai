const Project = require('../models/Project');

// Middleware to check if the user is the Admin of the project
const checkProjectAdmin = async (req, res, next) => {
  try {
    // Project ID can be in req.params.id or req.body.project
    const projectId = req.params.id || req.body.project;
    
    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: You must be the project Admin to perform this action' });
    }

    // Pass the project to the next middleware if needed
    req.project = project;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { checkProjectAdmin };
