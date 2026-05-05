const Task = require('../models/Task');
const Project = require('../models/Project');

// @desc    Create a task (Admin only)
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  try {
    const { title, description, project, assignedTo, dueDate, priority } = req.body;

    const task = new Task({
      title,
      description,
      project,
      assignedTo,
      dueDate,
      priority,
      createdBy: req.user._id
    });

    const createdTask = await task.save();
    res.status(201).json(createdTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all tasks for a project
// @route   GET /api/tasks/project/:id
// @access  Private
const getTasksByProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findById(projectId);
    
    if (!project) return res.status(404).json({ message: 'Project not found' });
    
    // Verify user is member or admin
    const isMember = project.members.some(m => m.toString() === req.user._id.toString());
    const isAdmin = project.admin.toString() === req.user._id.toString();

    if (!isMember && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view these tasks' });
    }

    const tasks = await Task.find({ project: projectId })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name');
      
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update task (status, assignee, etc.)
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const { status, priority, assignedTo, title, description, dueDate } = req.body;
    const task = await Task.findById(req.params.id).populate('project');

    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = task.project;
    const isAdmin = project.admin.toString() === req.user._id.toString();
    const isAssignee = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

    if (isAdmin) {
      // Admin can update anything
      task.title = title || task.title;
      task.description = description || task.description;
      task.status = status || task.status;
      task.priority = priority || task.priority;
      task.assignedTo = assignedTo || task.assignedTo;
      task.dueDate = dueDate || task.dueDate;
    } else if (isAssignee) {
      // Member can only update status
      if (status) task.status = status;
      if (title || description || priority || assignedTo || dueDate) {
        return res.status(403).json({ message: 'Members can only update task status' });
      }
    } else {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete task (Admin only)
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const isAdmin = task.project.admin.toString() === req.user._id.toString();
    if (!isAdmin) {
      return res.status(403).json({ message: 'Only project Admin can delete tasks' });
    }

    await task.deleteOne();
    res.json({ message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createTask, getTasksByProject, updateTask, deleteTask };
