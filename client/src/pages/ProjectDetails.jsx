import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, UserPlus, Trash2, ArrowLeft, X } from 'lucide-react';
import TaskCard from '../components/TaskCard';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api, user } = useAuth();
  
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  
  // Form states
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [editingTask, setEditingTask] = useState(null); // null if creating
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', dueDate: '', priority: 'Medium', status: 'To Do', assignedTo: ''
  });

  useEffect(() => {
    fetchProjectData();
  }, [id, api]);

  const fetchProjectData = async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks/project/${id}`)
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
    } catch (error) {
      console.error('Failed to fetch project details', error);
      if (error.response?.status === 403) navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = project?.admin?._id === user._id;

  // Member Management
  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${id}/members`, { email: newMemberEmail });
      setNewMemberEmail('');
      setShowMemberModal(false);
      fetchProjectData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      await api.delete(`/projects/${id}/members/${memberId}`);
      fetchProjectData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to remove member');
    }
  };

  // Task Management
  const openTaskModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setTaskForm({
        title: task.title,
        description: task.description || '',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        priority: task.priority,
        status: task.status,
        assignedTo: task.assignedTo?._id || ''
      });
    } else {
      setEditingTask(null);
      setTaskForm({
        title: '', description: '', dueDate: '', priority: 'Medium', status: 'To Do', assignedTo: ''
      });
    }
    setShowTaskModal(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        const payload = isAdmin ? taskForm : { status: taskForm.status };
        await api.put(`/tasks/${editingTask._id}`, payload);
      } else {
        await api.post('/tasks', { ...taskForm, project: id });
      }
      setShowTaskModal(false);
      fetchProjectData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save task');
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${editingTask._id}`);
      setShowTaskModal(false);
      fetchProjectData();
    } catch (error) {
      alert('Failed to delete task');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  if (!project) return <div>Project not found.</div>;

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <button onClick={() => navigate('/projects')} className="text-gray-400 hover:text-indigo-600 flex items-center text-sm mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Projects
          </button>
          <h2 className="text-2xl font-bold text-gray-900">{project.title}</h2>
          <p className="text-sm text-gray-500 mt-1">{project.description}</p>
        </div>
        
        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowMemberModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium"
            >
              <UserPlus className="w-4 h-4" /> Manage Members
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => openTaskModal()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add Task
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 min-h-0 overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-max h-full">
          {['To Do', 'In Progress', 'Done'].map(status => (
            <div key={status} className="w-80 flex flex-col bg-gray-100/50 rounded-xl border border-gray-200">
              <div className="p-4 border-b border-gray-200 bg-gray-50/80 rounded-t-xl flex justify-between items-center">
                <h3 className="font-semibold text-gray-700 uppercase tracking-wide text-xs">{status}</h3>
                <span className="bg-gray-200 text-gray-600 text-xs py-0.5 px-2 rounded-full font-medium">
                  {tasks.filter(t => t.status === status).length}
                </span>
              </div>
              <div className="p-3 flex-1 overflow-y-auto space-y-3">
                {tasks.filter(t => t.status === status).map(task => (
                  <TaskCard key={task._id} task={task} onClick={openTaskModal} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Member Management Modal (Admin Only) */}
      {showMemberModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Project Members</h3>
              <button onClick={() => setShowMemberModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            
            <form onSubmit={handleAddMember} className="flex gap-2 mb-6">
              <input
                type="email"
                required
                placeholder="User email address"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
              />
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">Add</button>
            </form>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {project.members.map(member => (
                <div key={member._id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{member.name} {project.admin._id === member._id && <span className="text-xs text-indigo-600 ml-1">(Admin)</span>}</p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                  {project.admin._id !== member._id && (
                    <button onClick={() => handleRemoveMember(member._id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">{editingTask ? 'Edit Task' : 'Create Task'}</h3>
              <button onClick={() => setShowTaskModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  disabled={!isAdmin && editingTask}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows="3"
                  disabled={!isAdmin && editingTask}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    disabled={!isAdmin && editingTask}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                  <select
                    disabled={!isAdmin && editingTask}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                    value={taskForm.assignedTo}
                    onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {project.members.map(m => (
                      <option key={m._id} value={m._id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    disabled={!isAdmin && editingTask}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-gray-100 mt-6">
                {isAdmin && editingTask ? (
                  <button type="button" onClick={handleDeleteTask} className="text-red-600 hover:bg-red-50 px-3 py-2 rounded-md text-sm font-medium">
                    Delete Task
                  </button>
                ) : <div></div>}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowTaskModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 rounded-md text-sm font-medium text-white hover:bg-indigo-700">
                    Save Task
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
