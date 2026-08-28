import { useState } from 'react';

function TaskForm({ onAddTask }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim()) {
      setFormError('Please enter a task title.');
      return;
    }

    setFormError('');
    const wasAdded = await onAddTask({
      title: title.trim(),
      description: description.trim(),
    });

    if (wasAdded) {
      setTitle('');
      setDescription('');
    }
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <label htmlFor="title">Title</label>
      <input
        id="title"
        maxLength="200"
        onChange={(event) => setTitle(event.target.value)}
        placeholder="What do you need to do?"
        value={title}
      />

      <label htmlFor="description">Description (optional)</label>
      <textarea
        id="description"
        maxLength="1000"
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Add a few details"
        rows="3"
        value={description}
      />

      {formError && <p className="form-error">{formError}</p>}
      <button type="submit">Add task</button>
    </form>
  );
}

export default TaskForm;
