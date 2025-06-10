const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { exec } = require('child_process');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());

const mongoURI = 'mongodb://localhost:27017/task-manager';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Schema: TaskExecution embedded in Task
const taskExecutionSchema = new mongoose.Schema({
  startTime: Date,
  endTime: Date,
  output: String,
});

const taskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: { type: String, required: true },
  command: { type: String, required: true },
  taskExecutions: [taskExecutionSchema],
});

const Task = mongoose.model('Task', taskSchema);

// Create a task
app.post('/tasks', async (req, res) => {
  const { name, owner, command } = req.body;
  if (!name || !owner || !command) {
    return res.status(400).json({ error: 'name, owner, and command are required' });
  }

  try {
    const newTask = new Task({ name, owner, command, taskExecutions: [] });
    await newTask.save();
    res.status(201).json(newTask);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ error: 'Server error while creating task' });
  }
});

// Get all tasks
app.get('/tasks', async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Server error while fetching tasks' });
  }
});

// Delete task
app.delete('/tasks/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Task.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Server error while deleting task' });
  }
});

// Run a command for a task and log the execution
app.post('/tasks/:id/run', async (req, res) => {
  const { id } = req.params;

  try {
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const startTime = new Date();

    exec(task.command, async (error, stdout, stderr) => {
      const endTime = new Date();
      const output = error ? stderr || error.message : stdout;

      task.taskExecutions.push({ startTime, endTime, output });
      await task.save();

      res.json({ success: true, output });
    });
  } catch (err) {
    console.error('Error running command:', err);
    res.status(500).json({ error: 'Error executing command' });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Unexpected server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
