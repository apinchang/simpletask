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
chrome.storage.local.get(['tasks', 'historyTasks', 'categoryTitles'], (result) => {
  if (result.tasks) {
    tasks = result.tasks;
  }
  if (result.historyTasks) {
    historyTasks = result.historyTasks;
  } else {
    historyTasks = [];
  }
  if (result.categoryTitles) {
    categoryTitles = result.categoryTitles;
  }
  
  // 根据当前页面渲染对应内容
  if (document.querySelector('#history-table')) {
    renderHistoryTasks();
  } else {
    renderAllTasks();
  }
});

// 为每个分类绑定事件
Object.keys(categoryMap).forEach(category => {
  const { button, input } = categoryMap[category];
  
  button.addEventListener('click', () => addTask(category));
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask(category);
  });
});

function addTask(category) {
  const input = categoryMap[category].input;
  const text = input.value.trim();
  
  if (text) {
    tasks[category].push({
      id: Date.now(),
      text,
      completed: false,
      createdAt: new Date().toISOString()
    });
    
    input.value = '';
    saveTasks();
    renderTasks(category);
  }
}

function renderAllTasks() {
  console.log('渲染所有任务:', tasks);
  renderCategoryTitles();
  Object.keys(categoryMap).forEach(renderTasks);
}

function renderTasks(category) {
  const list = categoryMap[category].list;
  if (!list) {
    console.error('找不到列表:', category);
    return;
  }
  
  console.log('渲染分类:', category, '任务数量:', tasks[category].length);
  
  list.innerHTML = tasks[category].map(task => `
    <li class="task-item" data-id="${task.id}">
      <span class="drag-icon">☰</span>
      <span class="task-text${task.completed ? ' completed' : ''}">${task.text}</span>
      <span class="delete-btn">×</span>
    </li>
  `).join('');

  // 绑定事件
  list.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', deleteTask);
  });

  list.querySelectorAll('.task-text').forEach(textElement => {
    textElement.addEventListener('dblclick', handleEditTask);
  });

  // 初始化SortableJS
  initSortable(category);
}

function deleteTask(e) {
  const taskItem = e.target.closest('li');
  const category = getTaskCategory(taskItem);
  const taskId = parseInt(taskItem.dataset.id);
  
  if (!confirm('确定要删除这个任务吗？')) return;

  // 找到要删除的任务
  const taskIndex = tasks[category].findIndex(t => t.id === taskId);
  if (taskIndex !== -1) {
    const task = tasks[category][taskIndex];
    
    // 从当前分类删除
    tasks[category].splice(taskIndex, 1);
    
    // 添加到历史记录
    const historyTask = {
      ...task,
      category: category,
      deletedAt: new Date().toISOString()
    };
    historyTasks.push(historyTask);
  }
  
  saveTasks();
  renderTasks(category);
}

function getTaskCategory(taskItem) {
  return Array.from(taskItem.closest('section').classList)
    .find(c => c in categoryMap) || 'normal';
}

function saveTasks() {
  console.log('保存数据:', { tasks, historyTasks, categoryTitles });
  chrome.storage.local.set({ tasks, historyTasks, categoryTitles }, () => {
    console.log('数据保存完成');
  });
}

// 调试函数：打印存储状态
function dumpStorage() {
  chrome.storage.local.get(['tasks', 'historyTasks'], (result) => {
    console.log('存储数据:', JSON.stringify({
      当前任务分类: result.tasks,
      历史任务记录: result.historyTasks
    }, null, 2));
  });
}

// 初始化渲染
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM加载完成，当前页面:', window.location.href);
  
  // 渲染分类标题
  renderCategoryTitles();
  
  // 绑定分类标题编辑事件
  bindCategoryTitleEdit();
  
  // 绑定页脚链接事件
  bindFooterLinks();
  
  // 如果是历史任务页面，确保渲染历史任务
  if (document.querySelector('#history-table')) {
    console.log('检测到历史任务页面');
    if (historyTasks.length > 0) {
      renderHistoryTasks();
    }
  }
});

// 渲染历史任务
function renderHistoryTasks() {
  const tableBody = document.querySelector('#history-table tbody');
  if (!tableBody) return;
  
  if (historyTasks.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">
          <p>暂无历史任务</p>
        </td>
      </tr>
    `;
    return;
  }
  
  tableBody.innerHTML = historyTasks.map(task => `
    <tr data-id="${task.id}">
      <td>${task.text}</td>
      <td>${formatDate(task.createdAt || new Date(task.id).toISOString())}</td>
      <td>${formatDate(task.deletedAt)}</td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-recover" data-id="${task.id}">恢复</button>
          <button class="btn btn-delete" data-id="${task.id}">彻底删除</button>
        </div>
      </td>
    </tr>
  `).join('');
  
  // 绑定恢复按钮事件
  document.querySelectorAll('.btn-recover').forEach(btn => {
    btn.addEventListener('click', recoverTask);
  });
  
  // 绑定彻底删除按钮事件
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', permanentlyDeleteTask);
  });
}

// 渲染分类标题
function renderCategoryTitles() {
  const urgentImportantTitle = document.querySelector('.urgent-important h2');
  const importantTitle = document.querySelector('.important h2');
  const normalTitle = document.querySelector('.category:not(.urgent-important):not(.important) h2');
  
  if (urgentImportantTitle) {
    urgentImportantTitle.textContent = categoryTitles.urgentImportant;
  }
  if (importantTitle) {
    importantTitle.textContent = categoryTitles.important;
  }
  if (normalTitle) {
    normalTitle.textContent = categoryTitles.normal;
  }
}

// 绑定分类标题编辑事件
function bindCategoryTitleEdit() {
  const titles = document.querySelectorAll('.category h2');
  
  titles.forEach(title => {
    title.addEventListener('dblclick', function() {
      const titleElement = this;
      const currentText = this.textContent;
      const category = this.closest('.category');
      
      // 确定分类类型
      let categoryType;
      if (category.classList.contains('urgent-important')) {
        categoryType = 'urgentImportant';
      } else if (category.classList.contains('important')) {
        categoryType = 'important';
      } else {
        categoryType = 'normal';
      }
      
      // 创建输入框
      const input = document.createElement('input');
      input.type = 'text';
      input.value = currentText;
      input.className = 'title-edit-input';
      
      // 替换标题
      this.style.display = 'none';
      this.parentNode.insertBefore(input, this);
      input.focus();
      input.select();
      
      // 保存函数
      const saveTitle = () => {
        const newTitle = input.value.trim();
        if (newTitle && newTitle !== currentText) {
          categoryTitles[categoryType] = newTitle;
          console.log('保存标题:', categoryType, newTitle);
          saveTasks();
        } else {
          console.log('标题未改变或为空，不保存');
        }
        titleElement.textContent = categoryTitles[categoryType];
        titleElement.style.display = '';
        input.remove();
      };
      
      // 绑定事件
      input.addEventListener('blur', saveTitle);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          input.blur();
        } else if (e.key === 'Escape') {
          titleElement.textContent = currentText;
          titleElement.style.display = '';
          input.remove();
        }
      });
    });
  });
}

// 格式化日期
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 恢复任务
function recoverTask(e) {
  const taskId = parseInt(e.target.dataset.id);
  const taskIndex = historyTasks.findIndex(t => t.id === taskId);
  
  if (taskIndex !== -1) {
    const task = historyTasks[taskIndex];
    
    // 从历史记录中删除
    historyTasks.splice(taskIndex, 1);
    
    // 恢复到原分类
    if (tasks[task.category]) {
      tasks[task.category].push({
        id: task.id,
        text: task.text,
        completed: task.completed,
        createdAt: task.createdAt || new Date(task.id).toISOString()
      });
    }
    
    saveTasks();
    renderHistoryTasks();
  }
}

// 彻底删除任务
function permanentlyDeleteTask(e) {
  const taskId = parseInt(e.target.dataset.id);
  
  if (confirm('确定要彻底删除这个任务吗？此操作不可恢复。')) {
    // 从历史记录中删除
    historyTasks = historyTasks.filter(t => t.id !== taskId);
    
    saveTasks();
    renderHistoryTasks();
  }
}

// 绑定页脚链接事件
function bindFooterLinks() {
  // 历史任务链接
  document.getElementById('history-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'history.html';
  });
  
  // 导出链接
  document.getElementById('export-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    handleExport();
  });
  
  // 导入链接
  document.getElementById('import-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    handleImport();
  });
}

// 处理导出功能
function handleExport() {
  const includeDeleted = confirm('是否包含已删除的任务？');
  
  // 准备导出数据
  const exportData = {
    tasks: tasks,
    historyTasks: includeDeleted ? historyTasks : [],
    exportDate: new Date().toISOString()
  };
  
  // 转换为JSON字符串
  const jsonString = JSON.stringify(exportData, null, 2);
  
  // 创建下载链接
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tasks-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 处理导入功能
function handleImport() {
  // 创建文件输入元素
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        
        // 验证数据格式
        if (importedData.tasks) {
          let importedCount = 0;
          
          // 合并任务数据，避免重复
          Object.keys(importedData.tasks).forEach(category => {
            if (tasks[category]) {
              importedData.tasks[category].forEach(importedTask => {
                // 检查是否存在相同内容的任务
                const isDuplicate = tasks[category].some(existingTask => 
                  existingTask.text === importedTask.text
                );
                
                if (!isDuplicate) {
                  tasks[category].push({
                    id: importedTask.id || Date.now(),
                    text: importedTask.text,
                    completed: importedTask.completed || false,
                    createdAt: importedTask.createdAt || new Date().toISOString()
                  });
                  importedCount++;
                }
              });
            }
          });
          
          // 合并历史任务
          if (importedData.historyTasks) {
            importedData.historyTasks.forEach(importedHistoryTask => {
              // 检查是否存在相同内容的历史任务
              const isDuplicate = historyTasks.some(existingTask => 
                existingTask.text === importedHistoryTask.text &&
                existingTask.deletedAt === importedHistoryTask.deletedAt
              );
              
              if (!isDuplicate) {
                historyTasks.push(importedHistoryTask);
              }
            });
          }
          
          // 保存并重新渲染
          saveTasks();
          renderAllTasks();
          alert(`导入成功！共导入 ${importedCount} 个新任务`);
        } else {
          alert('无效的导入文件格式');
        }
      } catch (error) {
        alert('导入失败：' + error.message);
      }
    };
    reader.readAsText(file);
  });
  
  input.click();
}



function getTaskCategory(taskItem) {
  return taskItem.closest('.category').classList.contains('urgent-important') ? 'urgentImportant' :
         taskItem.closest('.category').classList.contains('important') ? 'important' : 'normal';
}

function handleEditTask(e) {
  const taskItem = e.target.closest('li');
  const category = getTaskCategory(taskItem);
  const taskId = parseInt(taskItem.dataset.id);
  const task = tasks[category].find(t => t.id === taskId);
  
  if (!task) {
    console.error('Task not found:', {category, taskId});
    return;
  }

  const input = document.createElement('input');
  input.type = 'text';
  input.value = task.text;
  input.className = 'edit-input';
  
  input.addEventListener('blur', () => saveEdit(task, input.value));
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveEdit(task, input.value);
  });
  
  e.target.replaceWith(input);
  input.focus();
}

function saveEdit(task, newText) {
  task.text = newText.trim();
  saveTasks();
  renderAllTasks();
}

// 初始化SortableJS
function initSortable(category) {
  const list = categoryMap[category].list;
  if (!list) return;
  
  try {
    new Sortable(list, {
      animation: 150,
      handle: '.drag-icon',
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',
      group: 'tasks',
      onEnd: function(evt) {
        handleSortEnd(evt);
      }
    });
  } catch (error) {
    console.error('初始化SortableJS失败:', error);
  }
}

// 处理排序结束
function handleSortEnd(evt) {
  const { from, to, item, oldIndex, newIndex } = evt;
  const fromCategory = getCategoryFromList(from);
  const toCategory = getCategoryFromList(to);
  const taskId = parseInt(item.dataset.id);
  
  console.log('拖动结束:', { fromCategory, toCategory, taskId, oldIndex, newIndex });
  
  if (fromCategory === toCategory) {
    // 同一分类内排序
    const taskList = from.children;
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
      const taskList = to.children;
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