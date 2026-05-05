const Task = require('../models/Task');
const Project = require('../models/Project');

// @desc    Get dashboard stats
// @route   GET /api/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all projects where user is admin or member
    const projects = await Project.find({
      $or: [{ admin: userId }, { members: userId }]
    });

    const projectIds = projects.map(p => p._id);

    // Get tasks for those projects where the user is either assigned or is the admin
    // Or just all tasks assigned to the user + tasks in projects the user admins
    const adminProjectIds = projects.filter(p => p.admin.toString() === userId.toString()).map(p => p._id);
    
    const tasks = await Task.find({
      $or: [
        { assignedTo: userId },
        { project: { $in: adminProjectIds } }
      ]
    }).populate('assignedTo', 'name');

    const totalTasks = tasks.length;
    const completed = tasks.filter(t => t.status === 'Done').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const toDo = tasks.filter(t => t.status === 'To Do').length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueTasks = tasks.filter(t => {
      if (!t.dueDate || t.status === 'Done') return false;
      const dueDate = new Date(t.dueDate);
      return dueDate < today;
    });

    // Group tasks per user (for tasks in these projects)
    const tasksPerUser = {};
    tasks.forEach(t => {
      const assigneeName = t.assignedTo ? t.assignedTo.name : 'Unassigned';
      if (!tasksPerUser[assigneeName]) {
        tasksPerUser[assigneeName] = 0;
      }
      tasksPerUser[assigneeName]++;
    });

    const tasksPerUserArray = Object.keys(tasksPerUser).map(key => ({
      name: key,
      count: tasksPerUser[key]
    }));

    res.json({
      totalTasks,
      statusGroup: { toDo, inProgress, completed },
      tasksPerUser: tasksPerUserArray,
      overdueTasks
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardStats };
