
import React from 'react';
import './App.css';
import io from 'socket.io-client';

// API endpoint from environment variable (fallback to host backend port 5000)
// API endpoint detection for production/development
const API_URL = process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : `${window.location.protocol}//${window.location.hostname}:5001`);

// Initialize Socket.IO client
const socket = io(API_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

function App() {
  React.useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server');
    });
    return () => {
      socket.off('connect');
    };
  }, []);

  // ...existing code...

  // ...existing code...
  // Auth state
  const [token, setToken] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLogin, setIsLogin] = React.useState(true);
  const [authError, setAuthError] = React.useState("");

  // Task state
  const [tasks, setTasks] = React.useState([]);
  const [title, setTitle] = React.useState("");
  const [assignee, setAssignee] = React.useState("");
  const [deadline, setDeadline] = React.useState("");
  const [priority, setPriority] = React.useState("Medium");
  const [category, setCategory] = React.useState("");
  const [notification, setNotification] = React.useState("");
  const [selectedTask, setSelectedTask] = React.useState(null);
  const [comments, setComments] = React.useState([]);
  const [commentText, setCommentText] = React.useState("");
  const [attachments, setAttachments] = React.useState([]);
  const [activity, setActivity] = React.useState([]);
  const [file, setFile] = React.useState(null);

  // Fetch tasks from API
  React.useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setTasks(data));
  }, [token]);

  // Add new task (API + socket)
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!title) return;
    try {
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title, assignee, deadline, priority, category })
      });
      if (!res.ok) {
        const error = await res.json();
        setNotification(`Error: ${error.error || 'Failed to create task'}`);
        setTimeout(() => setNotification(""), 3000);
        return;
      }
      const newTask = await res.json();
      setTasks([newTask, ...tasks]);
      setTitle("");
      setAssignee("");
      setDeadline("");
      setPriority("Medium");
      setCategory("");
      socket.emit('task:add', newTask);
    } catch (error) {
      console.error('Error creating task:', error);
      setNotification('Network error: Could not create task');
      setTimeout(() => setNotification(""), 3000);
    }
  };

  // Update task status (API + socket)
  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        const error = await res.json();
        setNotification(`Error: ${error.error || 'Failed to update task'}`);
        setTimeout(() => setNotification(""), 3000);
        return;
      }
      const updated = await res.json();
      setTasks(tasks.map(task =>
        task._id === id ? updated : task
      ));
      socket.emit('task:update', { id, status });
    } catch (error) {
      console.error('Error updating task:', error);
      setNotification('Network error: Could not update task');
      setTimeout(() => setNotification(""), 3000);
    }
  };

  // Listen for real-time task events
  React.useEffect(() => {
    socket.on('task:add', (task) => {
      setTasks(prev => {
        if (prev.some(t => t._id === task._id)) return prev;
        return [task, ...prev];
      });
      setNotification(`Task "${task.title}" created by another user.`);
      setTimeout(() => setNotification(""), 3000);
    });
    socket.on('task:update', ({ id, status }) => {
      setTasks(prev => prev.map(task =>
        task._id === id ? { ...task, status } : task
      ));
      setNotification(`Task updated by another user.`);
      setTimeout(() => setNotification(""), 3000);
    });
    return () => {
      socket.off('task:add');
      socket.off('task:update');
    };
  }, []);

  // Auth handlers
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError("");
    const endpoint = isLogin ? 'login' : 'register';
    const res = await fetch(`${API_URL}/api/auth/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok && data.token) {
      setToken(data.token);
    } else if (res.ok && data.message) {
      setIsLogin(true);
    } else {
      setAuthError(data.error || 'Authentication failed');
    }
  };

  const handleLogout = () => {
    setToken("");
    setUsername("");
    setPassword("");
    setTasks([]);
  };

  // Modal logic
  const openTaskModal = async (task) => {
    setSelectedTask(task);

    // Join the task room for real-time updates
    socket.emit('join-task', task._id);

    try {
      // Fetch comments
      const resComments = await fetch(`${API_URL}/api/comments/${task._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComments(await resComments.json());

      // Fetch attachments
      const resAttachments = await fetch(`${API_URL}/api/attachments/${task._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttachments(await resAttachments.json());

      // Fetch activity log
      const resActivity = await fetch(`${API_URL}/api/activity/${task._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActivity(await resActivity.json());
    } catch (error) {
      console.error('Error loading task details:', error);
    }
  };

  const closeTaskModal = () => {
    if (selectedTask) {
      socket.emit('leave-task', selectedTask._id);
    }
    setSelectedTask(null);
    setComments([]);
    setAttachments([]);
    setActivity([]);
  };

  // Listen for real-time comment updates
  React.useEffect(() => {
    socket.on('comment:add', (comment) => {
      setComments(prev => [comment, ...prev]);
      setActivity(prev => [{
        user: comment.user,
        action: 'added a comment',
        timestamp: new Date()
      }, ...prev]);
    });

    socket.on('attachment:add', (attachment) => {
      setAttachments(prev => [attachment, ...prev]);
    });

    return () => {
      socket.off('comment:add');
      socket.off('attachment:add');
    };
  }, []);

  // Add comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText || !selectedTask) return;
    try {
      const res = await fetch(`${API_URL}/api/comments/${selectedTask._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: commentText })
      });
      if (!res.ok) {
        const error = await res.json();
        setNotification(`Error: ${error.error || 'Failed to add comment'}`);
        setTimeout(() => setNotification(""), 3000);
        return;
      }
      const newComment = await res.json();
      setComments([newComment, ...comments]);
      setCommentText("");
    } catch (error) {
      console.error('Error adding comment:', error);
      setNotification('Network error: Could not add comment');
      setTimeout(() => setNotification(""), 3000);
    }
  };

  // Upload file
  const handleUploadFile = async (e) => {
    e.preventDefault();
    if (!file || !selectedTask) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/api/attachments/${selectedTask._id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      if (!res.ok) {
        const error = await res.json();
        setNotification(`Error: ${error.error || 'Failed to upload file'}`);
        setTimeout(() => setNotification(""), 3000);
        return;
      }
      const newAttachment = await res.json();
      setAttachments([newAttachment, ...attachments]);
      setFile(null);
    } catch (error) {
      console.error('Error uploading file:', error);
      setNotification('Network error: Could not upload file');
      setTimeout(() => setNotification(""), 3000);
    }
  };

  // Delete task
  const handleDeleteTask = async () => {
    if (!selectedTask || !window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await fetch(`${API_URL}/api/tasks/${selectedTask._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const error = await res.json();
        setNotification(`Error: ${error.error || 'Failed to delete task'}`);
        return;
      }
      setTasks(prev => prev.filter(t => t._id !== selectedTask._id));
      closeTaskModal();
      setNotification('Task deleted successfully');
      setTimeout(() => setNotification(""), 3000);
    } catch (error) {
      console.error('Error deleting task:', error);
      setNotification('Network error: Could not delete task');
    }
  };

  // Edit task state
  const [isEditing, setIsEditing] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState("");
  const [editAssignee, setEditAssignee] = React.useState("");
  const [editDeadline, setEditDeadline] = React.useState("");
  const [editPriority, setEditPriority] = React.useState("Medium");
  const [editCategory, setEditCategory] = React.useState("");

  const startEditing = () => {
    if (!selectedTask) return;
    setEditTitle(selectedTask.title);
    setEditAssignee(selectedTask.assignee || "");
    setEditDeadline(selectedTask.deadline ? selectedTask.deadline.split('T')[0] : "");
    setEditPriority(selectedTask.priority || "Medium");
    setEditCategory(selectedTask.category || "");
    setIsEditing(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;
    try {
      const res = await fetch(`${API_URL}/api/tasks/${selectedTask._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editTitle,
          assignee: editAssignee,
          deadline: editDeadline,
          priority: editPriority,
          category: editCategory
        })
      });
      if (!res.ok) {
        const error = await res.json();
        setNotification(`Error: ${error.error || 'Failed to update task'}`);
        return;
      }
      const updated = await res.json();
      setTasks(prev => prev.map(t => t._id === updated._id ? updated : t));
      setSelectedTask(updated);
      setIsEditing(false);
      setNotification('Task updated successfully');
      socket.emit('task:update', { id: updated._id, status: updated.status }); // Notify others of update (reusing event for simplicity)
      setTimeout(() => setNotification(""), 3000);
    } catch (error) {
      console.error('Error updating task:', error);
      setNotification('Network error: Could not update task');
    }
  };

  return (
    <div className="app-container">
      {notification && (
        <div style={{ background: '#3182ce', color: '#fff', padding: '10px', borderRadius: '6px', marginBottom: '16px', textAlign: 'center' }}>
          {notification}
        </div>
      )}
      <h1>Tharanga</h1>
      {!token ? (
        <form onSubmit={handleAuth} style={{ marginBottom: 24 }}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={{ marginRight: 8, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ marginRight: 8, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
          />
          <button className="button" type="submit">{isLogin ? 'Login' : 'Register'}</button>
          <button type="button" className="button" style={{ marginLeft: 8 }} onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Switch to Register' : 'Switch to Login'}
          </button>
          {authError && <p style={{ color: 'red' }}>{authError}</p>}
        </form>
      ) : (
        <>
          <button className="button" style={{ float: 'right' }} onClick={handleLogout}>Logout</button>
          <form onSubmit={handleAddTask} style={{ marginBottom: 24, clear: 'both' }}>
            <input
              type="text"
              placeholder="Task title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{ marginRight: 8, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            />
            <input
              type="text"
              placeholder="Assignee"
              value={assignee}
              onChange={e => setAssignee(e.target.value)}
              style={{ marginRight: 8, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            />
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              style={{ marginRight: 8, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            />
            <select value={priority} onChange={e => setPriority(e.target.value)} style={{ marginRight: 8, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <input
              type="text"
              placeholder="Category"
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{ marginRight: 8, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            />
            <button className="button" type="submit">Add Task</button>
          </form>
          <div className="task-list">
            {tasks.length === 0 ? (
              <p>No tasks yet. Add one above!</p>
            ) : (
              tasks.map(task => (
                <div className="task-item" key={task._id} onClick={() => openTaskModal(task)} style={{ cursor: 'pointer' }}>
                  <div>
                    <strong>{task.title}</strong> <span className="status">[{task.status}]</span><br />
                    <span>Assignee: {task.assignee || "Unassigned"}</span><br />
                    <span>Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : "None"}</span><br />
                    <span>Priority: {task.priority || "Medium"}</span><br />
                    <span>Category: {task.category || "None"}</span>
                  </div>
                  <div>
                    {task.status !== "Completed" && (
                      <button className="button" onClick={e => { e.stopPropagation(); handleUpdateStatus(task._id, "Completed") }}>Mark Completed</button>
                    )}
                    {task.status === "Completed" && (
                      <span style={{ color: '#38a169' }}>✔</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Task Modal */}
          {selectedTask && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={closeTaskModal}>
              <div style={{ background: '#fff', padding: 32, borderRadius: 12, minWidth: 400, maxWidth: 600, position: 'relative' }} onClick={e => e.stopPropagation()}>
                <button style={{ position: 'absolute', top: 12, right: 12 }} onClick={closeTaskModal}>X</button>

                {isEditing ? (
                  <form onSubmit={handleSaveTask}>
                    <h2>Edit Task</h2>
                    <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Title" style={{ display: 'block', width: '100%', marginBottom: 8, padding: 8 }} required />
                    <input type="text" value={editAssignee} onChange={e => setEditAssignee(e.target.value)} placeholder="Assignee" style={{ display: 'block', width: '100%', marginBottom: 8, padding: 8 }} />
                    <input type="date" value={editDeadline} onChange={e => setEditDeadline(e.target.value)} style={{ display: 'block', width: '100%', marginBottom: 8, padding: 8 }} />
                    <select value={editPriority} onChange={e => setEditPriority(e.target.value)} style={{ display: 'block', width: '100%', marginBottom: 8, padding: 8 }}>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                    <input type="text" value={editCategory} onChange={e => setEditCategory(e.target.value)} placeholder="Category" style={{ display: 'block', width: '100%', marginBottom: 8, padding: 8 }} />
                    <button className="button" type="submit">Save Changes</button>
                    <button type="button" className="button" style={{ marginLeft: 8, background: '#ccc' }} onClick={() => setIsEditing(false)}>Cancel</button>
                  </form>
                ) : (
                  <>
                    <h2 style={{ marginRight: 40 }}>{selectedTask.title}</h2>
                    <div style={{ marginBottom: 12 }}>
                      <button className="button" style={{ marginRight: 8, background: '#ed8936' }} onClick={startEditing}>Edit Details</button>
                      <button className="button" style={{ background: '#e53e3e' }} onClick={handleDeleteTask}>Delete Task</button>
                    </div>
                    <p><strong>Assignee:</strong> {selectedTask.assignee || 'Unassigned'}</p>
                    <p><strong>Deadline:</strong> {selectedTask.deadline ? new Date(selectedTask.deadline).toLocaleDateString() : 'None'}</p>
                    <p><strong>Status:</strong> {selectedTask.status}</p>
                    <p><strong>Priority:</strong> {selectedTask.priority || 'Medium'}</p>
                    <p><strong>Category:</strong> {selectedTask.category || 'None'}</p>
                  </>
                )}

                <hr />
                {/* Comments */}
                <h3>Comments</h3>
                <div style={{ maxHeight: 120, overflowY: 'auto', marginBottom: 8 }}>
                  {comments.length === 0 ? <p>No comments yet.</p> : comments.map(c => (
                    <div key={c._id} style={{ marginBottom: 6 }}><strong>{c.user}:</strong> {c.text}</div>
                  ))}
                </div>
                <form onSubmit={handleAddComment} style={{ display: 'flex', marginBottom: 12 }}>
                  <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment..." style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
                  <button className="button" type="submit" style={{ marginLeft: 8 }}>Send</button>
                </form>
                <hr />
                {/* Attachments */}
                <h3>Attachments</h3>
                <div style={{ marginBottom: 8 }}>
                  <form onSubmit={handleUploadFile} style={{ display: 'flex' }}>
                    <input type="file" onChange={e => setFile(e.target.files[0])} style={{ flex: 1 }} />
                    <button className="button" type="submit" style={{ marginLeft: 8 }}>Upload</button>
                  </form>
                  <div>
                    {attachments.length === 0 ? <p>No files yet.</p> : attachments.map(a => (
                      <a key={a._id} href={a.url} target="_blank" rel="noopener noreferrer">{a.filename}</a>
                    ))}
                  </div>
                </div>
                <hr />
                {/* Activity Log */}
                <h3>Activity Log</h3>
                <div style={{ maxHeight: 80, overflowY: 'auto' }}>
                  {activity.length === 0 ? <p>No activity yet.</p> : activity.map(log => (
                    <div key={log._id}>{log.user}: {log.action} ({new Date(log.timestamp).toLocaleString()})</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
export default App;
