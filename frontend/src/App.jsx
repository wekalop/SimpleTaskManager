import { useEffect, useState } from 'react';
import TaskForm from './components/TaskForm.jsx';
import TaskList from './components/TaskList.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// One small helper keeps response parsing and error messages consistent.
async function apiRequest(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, options);
  } catch {
    throw new Error(
      'Cannot reach the backend. Check that NestJS is running on port 3001.',
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const serverMessage = Array.isArray(data?.message)
      ? data.message.join(', ')
      : data?.message;
    throw new Error(serverMessage || `Request failed (${response.status})`);
  }

  return data;
}

function App() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadTasks() {
    setLoading(true);
    setError('');

    try {
      const data = await apiRequest('/tasks');
      setTasks(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function addTask(taskData) {
    setError('');
    try {
      const newTask = await apiRequest('/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      setTasks((currentTasks) => [newTask, ...currentTasks]);
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    }
  }

  async function updateTask(id, changes) {
    setError('');
    try {
      const updatedTask = await apiRequest(`/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });
      setTasks((currentTasks) =>
        currentTasks.map((task) => (task.id === id ? updatedTask : task)),
      );
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    }
  }

  async function deleteTask(id) {
    setError('');
    try {
      await apiRequest(`/tasks/${id}`, { method: 'DELETE' });
      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== id),
      );
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'completed') return task.completed;
    if (filter === 'pending') return !task.completed;
    return true;
  });

  return (
    <main className="app">
      <h1>Task Manager</h1>
      <p className="subtitle">React → NestJS → Prisma → PostgreSQL</p>

      <TaskForm onAddTask={addTask} />

      {error && <div className="error-message">{error}</div>}

      <div className="filters" aria-label="Task filters">
        {['all', 'completed', 'pending'].map((name) => (
          <button
            className={filter === name ? 'active' : ''}
            key={name}
            onClick={() => setFilter(name)}
            type="button"
          >
            {name[0].toUpperCase() + name.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading tasks...</p>
      ) : (
        <TaskList
          tasks={filteredTasks}
          onUpdateTask={updateTask}
          onDeleteTask={deleteTask}
        />
      )}
    </main>
  );
}

export default App;
