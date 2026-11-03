// ==========================================
// 1. STATE & INITIALIZATION
// ==========================================
// --- LOCALSTORAGE API (READ) ---
let tasks = JSON.parse(localStorage.getItem('ordina_tasks')) || [];
let currentUser = JSON.parse(localStorage.getItem('ordina_user')) || null;
let savedTheme = localStorage.getItem('ordina_theme') || 'light';

// App State
let currentView = 'overview';
let currentCategory = null;
let currentFilter = 'all';
let currentSearch = '';
let currentSort = 'date-asc';
let taskToDeleteId = null;

// --- DOM MANIPULATION (SELECTING ELEMENTS) ---
const loginScreen = document.getElementById('login-screen');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const taskForm = document.getElementById('task-form');
const toggleHeader = document.getElementById('toggle-creation-panel');
const btnCancel = document.getElementById('btn-cancel');
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const pageTitle = document.getElementById('page-title');
const storagePreview = document.getElementById('storage-preview');

// Views
const dashboardView = document.getElementById('dashboard-view');
const profileView = document.getElementById('profile-view');
const settingsView = document.getElementById('settings-view');

// Profile & Settings
const openProfileBtn = document.getElementById('open-profile-btn');
const openSettingsBtn = document.getElementById('open-settings-btn');
const profileForm = document.getElementById('profile-form');
const themeLightBtn = document.getElementById('theme-light-btn');
const themeDarkBtn = document.getElementById('theme-dark-btn');
const clearDataBtn = document.getElementById('clear-data-btn');

// Notifications
const notificationBtn = document.getElementById('notification-btn');
const notificationDropdown = document.getElementById('notification-dropdown');
const notifList = document.getElementById('notif-list');
const notifCount = document.getElementById('notif-count');

// Edit Modal Elements
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const closeEditModal = document.getElementById('close-edit-modal');
const cancelEditBtn = document.getElementById('cancel-edit-btn');

// Delete Modal Elements
const deleteModal = document.getElementById('delete-modal');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

// Stats & Navigation
const statTotal = document.getElementById('stat-total');
const statActive = document.getElementById('stat-active');
const statCompleted = document.getElementById('stat-completed');
const taskCountBadge = document.getElementById('task-count');
const searchInput = document.getElementById('search-input');
const filterBtns = document.querySelectorAll('.filter-btn');
const sortSelect = document.getElementById('sort-select');
const navItems = document.querySelectorAll('.nav-item[data-view]');
const categoryItems = document.querySelectorAll('.nav-item[data-category]');

// ==========================================
// 2. LOCALSTORAGE API (SAVE & LOAD)
// ==========================================
function saveTasks() {
  // Save array to LocalStorage using JSON.stringify
  localStorage.setItem('ordina_tasks', JSON.stringify(tasks));
  
  // Update the Developer Inspector in Settings
  if (storagePreview) {
    storagePreview.textContent = JSON.stringify(tasks, null, 2) || "[]";
  }
}

function saveUser() {
  localStorage.setItem('ordina_user', JSON.stringify(currentUser));
}

function saveTheme(theme) {
  localStorage.setItem('ordina_theme', theme);
}

// ==========================================
// 3. THEME & SETTINGS LOGIC
// ==========================================
function applyTheme(theme) {
  // DOM Manipulation: Update HTML attribute
  document.documentElement.setAttribute('data-theme', theme);
  saveTheme(theme);
  
  if (theme === 'dark') {
    themeDarkBtn.classList.add('active');
    themeLightBtn.classList.remove('active');
  } else {
    themeLightBtn.classList.add('active');
    themeDarkBtn.classList.remove('active');
  }
}

applyTheme(savedTheme); // Load saved theme

themeLightBtn.addEventListener('click', () => applyTheme('light'));
themeDarkBtn.addEventListener('click', () => applyTheme('dark'));

clearDataBtn.addEventListener('click', () => {
  if (confirm("Are you sure? This will delete ALL your tasks and reset the app.")) {
    // LocalStorage API: Remove item
    localStorage.removeItem('ordina_tasks');
    tasks = [];
    saveTasks();
    renderTasks();
    showToast('All task data cleared.', 'error');
  }
});

// ==========================================
// 4. AUTHENTICATION & PROFILE SYNC
// ==========================================
function checkAuth() {
  if (currentUser) {
    loginScreen.classList.add('hidden');
    appContainer.classList.remove('hidden');
    syncUserUI();
    initApp();
  } else {
    loginScreen.classList.remove('hidden');
    appContainer.classList.add('hidden');
  }
}

function syncUserUI() {
  if (!currentUser) return;
  const initials = currentUser.name.charAt(0).toUpperCase();
  const firstName = currentUser.name.split(' ')[0];
  
  // --- DOM MANIPULATION (UPDATING TEXT CONTENT) ---
  document.getElementById('user-avatar').textContent = initials;
  document.getElementById('user-name-display').textContent = currentUser.name;
  document.getElementById('user-email-display').textContent = currentUser.email;
  
  document.getElementById('header-avatar').textContent = initials;
  document.getElementById('greeting-text').textContent = `Good morning, ${firstName}.`;
  
  document.getElementById('profile-avatar-large').textContent = initials;
  document.getElementById('profile-title-name').textContent = currentUser.name;
  document.getElementById('profile-title-email').textContent = currentUser.email;
  document.getElementById('profile-name-input').value = currentUser.name;
  document.getElementById('profile-email-input').value = currentUser.email;
  
  const totalCompleted = tasks.filter(t => t.completed).length;
  const productivity = tasks.length === 0 ? 0 : Math.round((totalCompleted / tasks.length) * 100);
  document.getElementById('profile-total-created').textContent = tasks.length;
  document.getElementById('profile-total-completed').textContent = totalCompleted;
  document.getElementById('profile-productivity').textContent = `${productivity}%`;
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  currentUser = {
    name: document.getElementById('login-name').value.trim(),
    email: document.getElementById('login-email').value.trim()
  };
  saveUser();
  checkAuth();
});

logoutBtn.addEventListener('click', (e) => {
  e.preventDefault();
  currentUser = null;
  localStorage.removeItem('ordina_user');
  document.getElementById('login-name').value = '';
  document.getElementById('login-email').value = '';
  checkAuth();
});

profileForm.addEventListener('submit', (e) => {
  e.preventDefault();
  currentUser.name = document.getElementById('profile-name-input').value.trim();
  currentUser.email = document.getElementById('profile-email-input').value.trim();
  saveUser();
  syncUserUI();
  showToast('Profile updated successfully!');
});

// ==========================================
// 5. NOTIFICATIONS LOGIC
// ==========================================
function updateNotifications() {
  const today = new Date(); today.setHours(0,0,0,0);
  const alerts = tasks.filter(t => {
    if (t.completed || !t.date) return false;
    const tDate = new Date(t.date); tDate.setHours(0,0,0,0);
    return tDate <= today;
  });

  // --- DOM MANIPULATION (CREATING DYNAMIC ELEMENTS) ---
  notifCount.textContent = `${alerts.length} new`;
  notifList.innerHTML = '';

  if (alerts.length === 0) {
    notifList.innerHTML = `<div class="notif-empty">You're all caught up! 🎉</div>`;
    return;
  }

  alerts.forEach(task => {
    const tDate = new Date(task.date); tDate.setHours(0,0,0,0);
    const isOverdue = tDate < today;
    
    const item = document.createElement('div'); // Create element
    item.className = 'notif-item';             // Add class
    item.innerHTML = `                         // Set HTML
      <p>${isOverdue ? '🚨 Overdue: ' : '⏰ Due Today: '} <strong>${task.title}</strong></p>
      <span>${task.category.toUpperCase()} • ${task.priority.toUpperCase()} priority</span>
    `;
    notifList.appendChild(item);               // Append to DOM
  });
}

notificationBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  notificationDropdown.classList.toggle('hidden');
});

document.addEventListener('click', (e) => {
  if (!notificationDropdown.contains(e.target) && e.target !== notificationBtn) {
    notificationDropdown.classList.add('hidden');
  }
});

// ==========================================
// 6. VIEW ROUTING (Navigation)
// ==========================================
function hideAllViews() {
  dashboardView.classList.add('hidden');
  profileView.classList.add('hidden');
  settingsView.classList.add('hidden');
}

openProfileBtn.addEventListener('click', (e) => {
  e.preventDefault();
  navItems.forEach(n => n.classList.remove('active'));
  categoryItems.forEach(c => c.classList.remove('active'));
  hideAllViews();
  profileView.classList.remove('hidden');
  syncUserUI();
});

openSettingsBtn.addEventListener('click', (e) => {
  e.preventDefault();
  navItems.forEach(n => n.classList.remove('active'));
  categoryItems.forEach(c => c.classList.remove('active'));
  hideAllViews();
  settingsView.classList.remove('hidden');
  
  // Update the LocalStorage Inspector
  storagePreview.textContent = JSON.stringify(tasks, null, 2) || "[]";
});

navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    navItems.forEach(n => n.classList.remove('active'));
    categoryItems.forEach(c => c.classList.remove('active'));
    item.classList.add('active');
    
    currentView = item.dataset.view;
    currentCategory = null;
    
    if (currentView === 'overview' || currentView === 'all') pageTitle.textContent = 'Your Tasks';
    else pageTitle.textContent = item.textContent.trim();
    
    filterBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('[data-filter="all"]').classList.add('active');
    currentFilter = 'all';
    
    renderTasks();
  });
});

categoryItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    navItems.forEach(n => n.classList.remove('active'));
    categoryItems.forEach(c => c.classList.remove('active'));
    item.classList.add('active');
    
    currentView = 'all';
    currentCategory = item.dataset.category;
    pageTitle.textContent = `${item.textContent.trim()} Tasks`;
    
    renderTasks();
  });
});

// ==========================================
// 7. HELPERS & CRUD LOGIC (DOM MANIPULATION)
// ==========================================
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div'); // Create
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✅' : '⚠️'}</span> ${message}`;
  container.appendChild(toast); // Append
  
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300); // Remove from DOM
  }, 3000);
}

function isToday(dateString) {
  if (!dateString) return false;
  const today = new Date();
  const taskDate = new Date(dateString);
  return taskDate.toDateString() === today.toDateString();
}

function getDateStatus(dateString) {
  if (!dateString) return { label: '', class: '' };
  const today = new Date(); today.setHours(0,0,0,0);
  const dueDate = new Date(dateString); dueDate.setHours(0,0,0,0);
  const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: 'Overdue', class: 'overdue' };
  if (diffDays === 0) return { label: 'Today', class: 'today' };
  if (diffDays === 1) return { label: 'Tomorrow', class: '' };
  return { label: new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), class: '' };
}

function renderTasks() {
  hideAllViews();
  dashboardView.classList.remove('hidden');
  updateNotifications();

  let filteredTasks = tasks.filter(task => {
    let matchesView = true;
    if (currentView === 'all') matchesView = true;
    else if (currentView === 'completed') matchesView = task.completed;
    else if (currentView === 'today') matchesView = isToday(task.date);
    else if (currentView === 'upcoming') {
      const today = new Date(); today.setHours(0,0,0,0);
      matchesView = new Date(task.date) > today && !task.completed;
    }
    const matchesCategory = currentCategory ? task.category === currentCategory : true;
    const matchesTab = currentFilter === 'all' ? true : currentFilter === 'active' ? !task.completed : task.completed;
    const matchesSearch = task.title.toLowerCase().includes(currentSearch.toLowerCase()) || (task.description && task.description.toLowerCase().includes(currentSearch.toLowerCase()));
    return matchesView && matchesCategory && matchesTab && matchesSearch;
  });

  if (currentSort !== 'manual') {
    filteredTasks.sort((a, b) => {
      if (currentSort === 'date-asc') return new Date(a.date || '9999-12-31') - new Date(b.date || '9999-12-31');
      if (currentSort === 'date-desc') return new Date(b.date || '0000-01-01') - new Date(a.date || '0000-01-01');
      if (currentSort === 'priority') {
        const pMap = { high: 3, medium: 2, low: 1 };
        return pMap[b.priority] - pMap[a.priority];
      }
      return 0;
    });
  }

  // --- DOM MANIPULATION (CLEARING AND RE-BUILDING LIST) ---
  taskList.innerHTML = '';
  if (filteredTasks.length === 0) {
    taskList.classList.add('hidden');
    emptyState.classList.remove('hidden');
  } else {
    taskList.classList.remove('hidden');
    emptyState.classList.add('hidden');
    
    filteredTasks.forEach((task, index) => {
      const dateStatus = getDateStatus(task.date);
      
      // Create list item element
      const li = document.createElement('li');
      li.className = `task-card ${task.completed ? 'completed' : ''}`;
      li.style.animationDelay = `${index * 0.05}s`;
      li.setAttribute('draggable', 'true');
      li.dataset.id = task.id;
      
      // Inject HTML content
      li.innerHTML = `
        <div class="drag-handle" title="Drag to reorder">⋮⋮</div>
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}">
        <div class="task-content">
          <span class="task-title-text">${task.title}</span>
          ${task.description ? `<span class="task-desc-text">${task.description}</span>` : ''}
          <div class="task-meta">
            <span class="badge ${task.category}">${task.category}</span>
            <span class="priority-indicator ${task.priority}">${task.priority}</span>
            ${task.date ? `<span class="due-date ${dateStatus.class}">📅 ${dateStatus.label}</span>` : ''}
          </div>
        </div>
        <div class="task-actions">
          <button class="action-btn edit" onclick="openEditModal('${task.id}')" title="Edit">✎</button>
          <button class="action-btn delete" onclick="openDeleteModal('${task.id}')" title="Delete">✕</button>
        </div>
      `;
      
      // Attach Event Listeners to elements
      li.querySelector('.task-checkbox').addEventListener('change', (e) => toggleTaskComplete(e.target.dataset.id, li));
      li.addEventListener('dragstart', handleDragStart);
      li.addEventListener('dragover', handleDragOver);
      li.addEventListener('dragleave', handleDragLeave);
      li.addEventListener('drop', handleDrop);
      li.addEventListener('dragend', handleDragEnd);

      // Append to DOM
      taskList.appendChild(li);
    });
  }
  updateStats();
}

function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  
  // --- DOM MANIPULATION (UPDATING NUMBERS) ---
  statTotal.textContent = total;
  statActive.textContent = total - completed;
  statCompleted.textContent = completed;
  taskCountBadge.textContent = `${total} total`;
}

function handleFormSubmit(e) {
  e.preventDefault();
  const newTask = {
    id: Date.now().toString(),
    title: document.getElementById('task-title').value.trim(),
    description: document.getElementById('task-desc').value.trim(),
    date: document.getElementById('task-date').value,
    category: document.getElementById('task-category').value,
    priority: document.getElementById('task-priority').value,
    completed: false
  };
  tasks.push(newTask);
  saveTasks();     // LocalStorage
  renderTasks();   // DOM Manipulation
  toggleForm();
  showToast('Task created successfully!');
}

function toggleTaskComplete(id, cardElement) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    if (task.completed && cardElement) {
      cardElement.classList.add('just-completed');
      setTimeout(() => renderTasks(), 300);
    } else {
      renderTasks();
    }
    if (task.completed) showToast('Task completed!');
  }
}

window.openEditModal = function(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  document.getElementById('edit-id').value = task.id;
  document.getElementById('edit-title').value = task.title;
  document.getElementById('edit-desc').value = task.description || '';
  document.getElementById('edit-date').value = task.date || '';
  document.getElementById('edit-category').value = task.category;
  document.getElementById('edit-priority').value = task.priority;
  editModal.classList.remove('hidden');
};

editForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('edit-id').value;
  const taskIndex = tasks.findIndex(t => t.id === id);
  if (taskIndex > -1) {
    tasks[taskIndex] = {
      ...tasks[taskIndex],
      title: document.getElementById('edit-title').value.trim(),
      description: document.getElementById('edit-desc').value.trim(),
      date: document.getElementById('edit-date').value,
      category: document.getElementById('edit-category').value,
      priority: document.getElementById('edit-priority').value
    };
    saveTasks();
    renderTasks();
    editModal.classList.add('hidden');
    showToast('Task updated successfully!');
  }
});

closeEditModal.addEventListener('click', () => editModal.classList.add('hidden'));
cancelEditBtn.addEventListener('click', () => editModal.classList.add('hidden'));

window.openDeleteModal = function(id) {
  taskToDeleteId = id;
  deleteModal.classList.remove('hidden');
};

cancelDeleteBtn.addEventListener('click', () => {
  deleteModal.classList.add('hidden');
  taskToDeleteId = null;
});

confirmDeleteBtn.addEventListener('click', () => {
  if (taskToDeleteId) {
    tasks = tasks.filter(t => t.id !== taskToDeleteId);
    saveTasks();
    renderTasks();
    deleteModal.classList.add('hidden');
    showToast('Task deleted.', 'error');
    taskToDeleteId = null;
  }
});

function toggleForm() {
  const isHidden = taskForm.classList.contains('hidden');
  const plusIcon = document.getElementById('plus-icon');
  if (isHidden) {
    taskForm.classList.remove('hidden');
    plusIcon.classList.add('rotate');
    document.getElementById('task-title').focus();
    document.getElementById('task-date').valueAsDate = new Date();
  } else {
    taskForm.classList.add('hidden');
    plusIcon.classList.remove('rotate');
    taskForm.reset();
  }
}

toggleHeader.addEventListener('click', toggleForm);
btnCancel.addEventListener('click', toggleForm);
taskForm.addEventListener('submit', handleFormSubmit);

searchInput.addEventListener('input', (e) => { currentSearch = e.target.value; renderTasks(); });
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});
sortSelect.addEventListener('change', (e) => { currentSort = e.target.value; renderTasks(); });

document.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
    e.preventDefault();
    if (taskForm.classList.contains('hidden') && !dashboardView.classList.contains('hidden')) toggleForm();
  }
});

// Drag & Drop
let draggedItem = null;
function handleDragStart(e) {
  draggedItem = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  currentSort = 'manual';
  document.getElementById('sort-select').value = 'manual';
}
function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  if (this !== draggedItem) this.classList.add('drag-over');
}
function handleDragLeave() { this.classList.remove('drag-over'); }
function handleDrop() {
  this.classList.remove('drag-over');
  if (this !== draggedItem) {
    const allCards = [...taskList.querySelectorAll('.task-card')];
    const draggedIndex = allCards.indexOf(draggedItem);
    const droppedIndex = allCards.indexOf(this);
    if (draggedIndex < droppedIndex) this.parentNode.insertBefore(draggedItem, this.nextSibling);
    else this.parentNode.insertBefore(draggedItem, this);
    
    const newTaskOrderIds = [...taskList.querySelectorAll('.task-card')].map(card => card.dataset.id);
    const reorderedTasks = [];
    newTaskOrderIds.forEach(id => {
      const task = tasks.find(t => t.id === id);
      if (task) reorderedTasks.push(task);
    });
    tasks.forEach(task => {
      if (!newTaskOrderIds.includes(task.id)) reorderedTasks.push(task);
    });
    tasks = reorderedTasks;
    saveTasks();
  }
}
function handleDragEnd() {
  this.classList.remove('dragging');
  taskList.querySelectorAll('.task-card').forEach(card => card.classList.remove('drag-over'));
}

// INIT
function initApp() {
  const dateOptions = { weekday: 'long', month: 'long', day: 'numeric' };
  document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', dateOptions);
  renderTasks();
}

checkAuth();