// 初始化存储
let tasks = {
  urgentImportant: [],
  important: [],
  normal: []
};

// 历史任务存储
let historyTasks = [];

// 分类标题存储
let categoryTitles = {
  urgentImportant: '🔥 重要且紧急',
  important: '⏳ 重要不紧急',
  normal: '📦 不重要不紧急，不干也行'
};

// DOM元素
const categoryMap = {
  urgentImportant: {
    input: document.querySelector('.urgent-important input'),
    button: document.querySelector('.urgent-important button'),
    list: document.querySelector('.urgent-important .task-list')
  },
  important: {
    input: document.querySelector('.important input'),
    button: document.querySelector('.important button'),
    list: document.querySelector('.important .task-list')
  },
  normal: {
    input: document.querySelector('.category:not(.urgent-important):not(.important) input'),
    button: document.querySelector('.category:not(.urgent-important):not(.important) button'),
    list: document.querySelector('.category:not(.urgent-important):not(.important) .task-list')
  }
};

// 加载保存的任务
function loadSavedData() {
  try {
    const tasksData = localStorage.getItem('tasks');
    if (tasksData) {
      tasks = JSON.parse(tasksData);
    }
    
    const historyTasksData = localStorage.getItem('historyTasks');
    if (historyTasksData) {
      historyTasks = JSON.parse(historyTasksData);
    } else {
      historyTasks = [];
    }
    
    const categoryTitlesData = localStorage.getItem('categoryTitles');
    if (categoryTitlesData) {
      categoryTitles = JSON.parse(categoryTitlesData);
    }
    
    // 渲染所有任务
    renderAllTasks();
  } catch (error) {
    console.error('加载数据失败:', error);
    // 渲染所有任务
    renderAllTasks();
  }
}

// 保存任务
function saveTasks() {
  try {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('historyTasks', JSON.stringify(historyTasks));
    localStorage.setItem('categoryTitles', JSON.stringify(categoryTitles));
  } catch (error) {
    console.error('保存数据失败:', error);
  }
}

// 渲染所有任务
function renderAllTasks() {
  renderTasks('urgentImportant');
  renderTasks('important');
  renderTasks('normal');
}

// 渲染任务
function renderTasks(category) {
  const list = categoryMap[category].list;
  const tasksList = tasks[category] || [];
  
  list.innerHTML = tasksList.map(task => `
    <li class="task-item" data-id="${task.id}">
      <span class="task-text ${task.completed ? 'completed' : ''}">${task.text}</span>
      <span class="delete-btn">×</span>
    </li>
  `).join('');
  
  // 绑定事件
  list.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', deleteTask);
  });
  
  list.querySelectorAll('.task-text').forEach(text => {
    text.addEventListener('click', toggleTaskComplete);
  });
  
  // 初始化SortableJS
  new Sortable(list, {
    group: 'tasks',
    animation: 150,
    ghostClass: 'sortable-ghost',
    onEnd: handleTaskMove
  });
}

// 删除任务
function deleteTask(e) {
  const taskItem = e.target.closest('li');
  const category = getTaskCategory(taskItem);
  const taskId = parseInt(taskItem.dataset.id);
  
  if (!confirm('确定要删除这个任务吗？')) return;
  
  const taskIndex = tasks[category].findIndex(t => t.id === taskId);
  if (taskIndex !== -1) {
    const task = tasks[category][taskIndex];
    tasks[category].splice(taskIndex, 1);
    
    // 添加到历史记录
    const historyTask = {
      ...task,
      category: categoryTitles[category],
      deletedAt: Date.now()
    };
    historyTasks.push(historyTask);
  }
  
  saveTasks();
  renderTasks(category);
}

// 切换任务完成状态
function toggleTaskComplete(e) {
  const taskItem = e.target.closest('li');
  const category = getTaskCategory(taskItem);
  const taskId = parseInt(taskItem.dataset.id);
  
  const taskIndex = tasks[category].findIndex(t => t.id === taskId);
  if (taskIndex !== -1) {
    tasks[category][taskIndex].completed = !tasks[category][taskIndex].completed;
    saveTasks();
    renderTasks(category);
  }
}

// 获取任务所属分类
function getTaskCategory(taskItem) {
  const categoryElement = taskItem.closest('.category');
  if (categoryElement.classList.contains('urgent-important')) {
    return 'urgentImportant';
  } else if (categoryElement.classList.contains('important')) {
    return 'important';
  } else {
    return 'normal';
  }
}

// 处理任务移动
function handleTaskMove(e) {
  const fromList = e.from;
  const toList = e.to;
  const taskItem = e.item;
  const taskId = parseInt(taskItem.dataset.id);
  
  const fromCategory = getCategoryFromList(fromList);
  const toCategory = getCategoryFromList(toList);
  
  if (fromCategory === toCategory) {
    // 同一分类内排序
    const taskList = Array.from(toList.children);
    const newOrder = [];
    
    for (let i = 0; i < taskList.length; i++) {
      const itemId = parseInt(taskList[i].dataset.id);
      const task = tasks[fromCategory].find(t => t.id === itemId);
      if (task) {
        newOrder.push(task);
      }
    }
    
    tasks[fromCategory] = newOrder;
  } else {
    // 跨分类拖动
    const taskIndex = tasks[fromCategory].findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      const task = tasks[fromCategory].splice(taskIndex, 1)[0];
      
      // 插入到新分类的正确位置
      const taskList = Array.from(toList.children);
      const newOrder = [];
      
      for (let i = 0; i < taskList.length; i++) {
        const itemId = parseInt(taskList[i].dataset.id);
        if (itemId === taskId) {
          newOrder.push(task);
        } else {
          const existingTask = tasks[toCategory].find(t => t.id === itemId);
          if (existingTask) {
            newOrder.push(existingTask);
          }
        }
      }
      
      tasks[toCategory] = newOrder;
    }
  }
  
  saveTasks();
  renderAllTasks();
}

// 从列表获取分类
function getCategoryFromList(list) {
  const categoryElement = list.closest('.category');
  if (!categoryElement) return 'normal';
  
  return categoryElement.classList.contains('urgent-important') ? 'urgentImportant' :
         categoryElement.classList.contains('important') ? 'important' : 'normal';
}

// 添加任务
function addTask(category) {
  const input = categoryMap[category].input;
  const text = input.value.trim();
  
  if (!text) return;
  
  const task = {
    id: Date.now(),
    text: text,
    completed: false,
    createdAt: Date.now()
  };
  
  tasks[category].push(task);
  input.value = '';
  
  saveTasks();
  renderTasks(category);
}

// 绑定添加任务事件
categoryMap.urgentImportant.button.addEventListener('click', () => addTask('urgentImportant'));
categoryMap.urgentImportant.input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addTask('urgentImportant');
});

categoryMap.important.button.addEventListener('click', () => addTask('important'));
categoryMap.important.input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addTask('important');
});

categoryMap.normal.button.addEventListener('click', () => addTask('normal'));
categoryMap.normal.input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addTask('normal');
});

// 绑定历史任务链接事件
document.getElementById('history-link').addEventListener('click', (e) => {
  e.preventDefault();
  // 显示历史任务
  alert('历史任务功能需要单独实现');
});

// 绑定导出链接事件
document.getElementById('export-link').addEventListener('click', (e) => {
  e.preventDefault();
  // 导出任务
  const data = JSON.stringify(tasks);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tasks.json';
  a.click();
  URL.revokeObjectURL(url);
});

// 绑定导入链接事件
document.getElementById('import-link').addEventListener('click', (e) => {
  e.preventDefault();
  // 导入任务
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedTasks = JSON.parse(event.target.result);
          tasks = importedTasks;
          saveTasks();
          renderAllTasks();
          alert('导入成功');
        } catch (error) {
          alert('导入失败: ' + error.message);
        }
      };
      reader.readAsText(file);
    }
  });
  input.click();
});

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', loadSavedData);