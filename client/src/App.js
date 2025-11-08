
import React from 'react';
import { io } from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:5000');

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
      fetch('http://localhost:5000/api/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setTasks(data));
    }, [token]);

    // Add new task (API + socket)
    const handleAddTask = async (e) => {
      e.preventDefault();
      if (!title) return;
      const res = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title, assignee, deadline, priority, category })
      });
      const newTask = await res.json();
      setTasks([newTask, ...tasks]);
      setTitle("");
      setAssignee("");
      setDeadline("");
      setPriority("Medium");
      setCategory("");
      socket.emit('task:add', newTask);
    };

    // Update task status (API + socket)
    const handleUpdateStatus = async (id, status) => {
      const res = await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const updated = await res.json();
      setTasks(tasks.map(task =>
        task._id === id ? updated : task
      ));
      socket.emit('task:update', { id, status });
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
      const res = await fetch(`http://localhost:5000/api/auth/${endpoint}`, {
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
      // Fetch comments
      const resComments = await fetch(`http://localhost:5000/api/comments/${task._id}`, { headers: { Authorization: `Bearer ${token}` } });
      setComments(await resComments.json());
      // Fetch attachments
      const resAttachments = await fetch(`http://localhost:5000/api/attachments/${task._id}`, { headers: { Authorization: `Bearer ${token}` } });
      setAttachments(await resAttachments.json());
      // Fetch activity log
      const resActivity = await fetch(`http://localhost:5000/api/activity/${task._id}`, { headers: { Authorization: `Bearer ${token}` } });
      setActivity(await resActivity.json());
    };

    // Add comment
    const handleAddComment = async (e) => {
      e.preventDefault();
      if (!commentText || !selectedTask) return;
      const res = await fetch(`http://localhost:5000/api/comments/${selectedTask._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: commentText })
      });
      const newComment = await res.json();
      setComments([newComment, ...comments]);
      setCommentText("");
    };

    // Upload file
    const handleUploadFile = async (e) => {
      e.preventDefault();
      if (!file || !selectedTask) return;
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`http://localhost:5000/api/attachments/${selectedTask._id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      const newAttachment = await res.json();
      setAttachments([newAttachment, ...attachments]);
      setFile(null);
    };

    return (
      <div className="app-container">
          {notification && (
            <div style={{background:'#3182ce',color:'#fff',padding:'10px',borderRadius:'6px',marginBottom:'16px',textAlign:'center'}}>
              {notification}
            </div>
          )}
        <h1>TaskMaster</h1>
        {!token ? (
          <form onSubmit={handleAuth} style={{marginBottom: 24}}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{marginRight: 8, padding: 8, borderRadius: 4, border: '1px solid #ccc'}}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{marginRight: 8, padding: 8, borderRadius: 4, border: '1px solid #ccc'}}
            />
            <button className="button" type="submit">{isLogin ? 'Login' : 'Register'}</button>
            <button type="button" className="button" style={{marginLeft: 8}} onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'Switch to Register' : 'Switch to Login'}
            </button>
            {authError && <p style={{color: 'red'}}>{authError}</p>}
          </form>
        ) : (
          <>
            <button className="button" style={{float: 'right'}} onClick={handleLogout}>Logout</button>
            <form onSubmit={handleAddTask} style={{marginBottom: 24, clear: 'both'}}>
              <input
                type="text"
                placeholder="Task title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{marginRight: 8, padding: 8, borderRadius: 4, border: '1px solid #ccc'}}
              />
              <input
                type="text"
                placeholder="Assignee"
                value={assignee}
                onChange={e => setAssignee(e.target.value)}
                style={{marginRight: 8, padding: 8, borderRadius: 4, border: '1px solid #ccc'}}
              />
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                style={{marginRight: 8, padding: 8, borderRadius: 4, border: '1px solid #ccc'}}
              />
              <select value={priority} onChange={e => setPriority(e.target.value)} style={{marginRight:8,padding:8,borderRadius:4,border:'1px solid #ccc'}}>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <input
                type="text"
                placeholder="Category"
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{marginRight: 8, padding: 8, borderRadius: 4, border: '1px solid #ccc'}}
              />
              <button className="button" type="submit">Add Task</button>
            </form>
            <div className="task-list">
              {tasks.length === 0 ? (
                <p>No tasks yet. Add one above!</p>
              ) : (
                tasks.map(task => (
                  <div className="task-item" key={task._id} onClick={() => openTaskModal(task)} style={{cursor:'pointer'}}>
                    <div>
                      <strong>{task.title}</strong> <span className="status">[{task.status}]</span><br/>
                      <span>Assignee: {task.assignee || "Unassigned"}</span><br/>
                      <span>Deadline: {task.deadline || "None"}</span><br/>
                      <span>Priority: {task.priority || "Medium"}</span><br/>
                      <span>Category: {task.category || "None"}</span>
                    </div>
                    <div>
                      {task.status !== "Completed" && (
                        <button className="button" onClick={e => {e.stopPropagation(); handleUpdateStatus(task._id, "Completed")}}>Mark Completed</button>
                      )}
                      {task.status === "Completed" && (
                        <span style={{color: '#38a169'}}>✔</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* Task Modal */}
            {selectedTask && (
              <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.3)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}} onClick={() => setSelectedTask(null)}>
                <div style={{background:'#fff',padding:32,borderRadius:12,minWidth:400,maxWidth:600,position:'relative'}} onClick={e => e.stopPropagation()}>
                  <button style={{position:'absolute',top:12,right:12}} onClick={() => setSelectedTask(null)}>X</button>
                  <h2>{selectedTask.title}</h2>
                  <p><strong>Assignee:</strong> {selectedTask.assignee || 'Unassigned'}</p>
                  <p><strong>Deadline:</strong> {selectedTask.deadline || 'None'}</p>
                  <p><strong>Status:</strong> {selectedTask.status}</p>
                  <p><strong>Priority:</strong> {selectedTask.priority || 'Medium'}</p>
                  <p><strong>Category:</strong> {selectedTask.category || 'None'}</p>
                  <hr/>
                  {/* Comments */}
                  <h3>Comments</h3>
                  <div style={{maxHeight:120,overflowY:'auto',marginBottom:8}}>
                    {comments.length === 0 ? <p>No comments yet.</p> : comments.map(c => (
                      <div key={c._id} style={{marginBottom:6}}><strong>{c.user}:</strong> {c.text}</div>
                    ))}
                  </div>
                  <form onSubmit={handleAddComment} style={{display:'flex',marginBottom:12}}>
                    <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment..." style={{flex:1,padding:8,borderRadius:4,border:'1px solid #ccc'}} />
                    <button className="button" type="submit" style={{marginLeft:8}}>Send</button>
                  </form>
                  <hr/>
                  {/* Attachments */}
                  <h3>Attachments</h3>
                  <div style={{marginBottom:8}}>
                    <form onSubmit={handleUploadFile} style={{display:'flex'}}>
                      <input type="file" onChange={e => setFile(e.target.files[0])} style={{flex:1}} />
                      <button className="button" type="submit" style={{marginLeft:8}}>Upload</button>
                    </form>
                    <div>
                      {attachments.length === 0 ? <p>No files yet.</p> : attachments.map(a => (
                        <a key={a._id} href={a.url} target="_blank" rel="noopener noreferrer">{a.filename}</a>
                      ))}
                    </div>
                  </div>
                  <hr/>
                  {/* Activity Log */}
                  <h3>Activity Log</h3>
                  <div style={{maxHeight:80,overflowY:'auto'}}>
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
