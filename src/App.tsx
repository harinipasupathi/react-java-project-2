import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface TaskExecution {
  startTime: string;
  endTime: string;
  output: string;
}

interface Task {
  id: string;
  name: string;
  owner: string;
  command: string;
  taskExecutions: TaskExecution[];
}

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [name, setName] = useState('');
  const [owner, setOwner] = useState('');
  const [command, setCommand] = useState('');
  const [search, setSearch] = useState('');

  const fetchTasks = async () => {
    try {
      const res = await axios.get('http://localhost:4000/tasks');
      const tasksFromBackend: Task[] = (res.data as any[]).map((task: any) => ({
        id: task._id,
        name: task.name,
        owner: task.owner,
        command: task.command,
        taskExecutions: task.taskExecutions || [],
      }));
      setTasks(tasksFromBackend);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  const createTask = async () => {
    if (!name || !owner || !command) return;
    try {
      await axios.post('http://localhost:4000/tasks', {
        name,
        owner,
        command,
      });
      setName('');
      setOwner('');
      setCommand('');
      fetchTasks();
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await axios.delete(`http://localhost:4000/tasks/${id}`);
      fetchTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const runTask = async (id: string) => {
    try {
      await axios.post(`http://localhost:4000/tasks/${id}/run`);
      fetchTasks(); // Refresh to update taskExecutions
    } catch (err) {
      console.error('Error running task:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Task Manager</h1>

      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
        <input
          className="border p-2"
          placeholder="Task Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="border p-2"
          placeholder="Owner"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
        />
        <input
          className="border p-2"
          placeholder="Shell Command"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
        />
        <button className="bg-blue-500 text-white px-4 py-2" onClick={createTask}>
          Create Task
        </button>
      </div>

      <input
        className="border p-2 mb-4 w-full"
        placeholder="Search by Task Name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <table className="w-full table-auto border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border px-4 py-2">Name</th>
            <th className="border px-4 py-2">Owner</th>
            <th className="border px-4 py-2">Command</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks
            .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
            .map((task) => (
              <React.Fragment key={task.id}>
                <tr>
                  <td className="border px-4 py-2">{task.name}</td>
                  <td className="border px-4 py-2">{task.owner}</td>
                  <td className="border px-4 py-2">{task.command}</td>
                  <td className="border px-4 py-2 space-x-2">
                    <button
                      className="bg-green-500 text-white px-2 py-1 rounded"
                      onClick={() => runTask(task.id)}
                    >
                      Run
                    </button>
                    <button
                      className="text-red-500 px-2 py-1"
                      onClick={() => deleteTask(task.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
                {task.taskExecutions.length > 0 && (
                  <tr className="bg-gray-50">
                    <td colSpan={4} className="border px-4 py-2 text-sm">
                      <strong>Execution History:</strong>
                      <ul className="mt-2 space-y-1">
                        {task.taskExecutions.map((exec, idx) => (
                          <li key={idx} className="bg-white p-2 border rounded">
                            <div>
                              <strong>Start:</strong> {new Date(exec.startTime).toLocaleString()}
                            </div>
                            <div>
                              <strong>End:</strong> {new Date(exec.endTime).toLocaleString()}
                            </div>
                            <div>
                              <strong>Output:</strong>
                              <pre className="bg-gray-100 p-2 mt-1 whitespace-pre-wrap overflow-auto">
                                {exec.output}
                              </pre>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default App;
