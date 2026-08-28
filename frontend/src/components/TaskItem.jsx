import { useState } from 'react';

function TaskItem({ task, onUpdateTask, onDeleteTask }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [editError, setEditError] = useState('');

  async function saveEdit(event) {
    event.preventDefault();

    if (!title.trim()) {
      setEditError('Title cannot be empty.');
      return;
    }

    const wasUpdated = await onUpdateTask(task.id, {
      title: title.trim(),
      description: description.trim(),
    });

    if (wasUpdated) {
      setEditError('');
      setIsEditing(false);
    }
  }

  function cancelEdit() {
    setTitle(task.title);
    setDescription(task.description || '');
    setEditError('');
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <li className="task-item">
        <form className="edit-form" onSubmit={saveEdit}>
          <input
            aria-label="Edit title"
            maxLength="200"
            onChange={(event) => setTitle(event.target.value)}
            value={title}
          />
          <textarea
            aria-label="Edit description"
            maxLength="1000"
            onChange={(event) => setDescription(event.target.value)}
            rows="2"
            value={description}
          />
          {editError && <p className="form-error">{editError}</p>}
          <div className="task-actions">
            <button type="submit">Save</button>
            <button className="secondary" onClick={cancelEdit} type="button">
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className={`task-item ${task.completed ? 'completed' : ''}`}>
      <div className="task-heading">
        <input
          aria-label={`Mark ${task.title} as completed`}
          checked={task.completed}
          onChange={() =>
            onUpdateTask(task.id, { completed: !task.completed })
          }
          type="checkbox"
        />
        <div>
          <h2>{task.title}</h2>
          {task.description && <p>{task.description}</p>}
        </div>
      </div>
      <div className="task-actions">
        <button onClick={() => setIsEditing(true)} type="button">
          Edit
        </button>
        <button
          className="danger"
          onClick={() => onDeleteTask(task.id)}
          type="button"
        >
          Delete
        </button>
      </div>
    </li>
  );
}

export default TaskItem;
