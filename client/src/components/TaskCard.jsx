import { Calendar, User, Edit2 } from 'lucide-react';

const TaskCard = ({ task, onClick }) => {
  const priorityColors = {
    Low: 'bg-green-100 text-green-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    High: 'bg-red-100 text-red-800'
  };

  return (
    <div 
      onClick={() => onClick(task)}
      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group relative"
    >
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="text-gray-400 hover:text-indigo-600">
          <Edit2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex justify-between items-start mb-2 pr-6">
        <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 leading-tight">{task.title}</h4>
      </div>
      
      <div className="flex items-center gap-2 mb-3">
        <span className={`px-2 inline-flex text-[10px] leading-4 font-semibold rounded-full ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
        <div className="flex items-center text-xs text-gray-500 gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No due date'}
        </div>
        
        {task.assignedTo ? (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold" title={task.assignedTo.name}>
            {task.assignedTo.name.charAt(0).toUpperCase()}
          </div>
        ) : (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-400" title="Unassigned">
            <User className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
