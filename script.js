// 初始化存储
let tasks = {
  urgentImportant: [],
  important: [],
  normal: []
};

// 主题存储
let currentTheme = 'default';

// 历史任务存储
let historyTasks = [];

// 分类标题存储
let categoryTitles = {
  urgentImportant: '🔥 重要且紧急',
  important: '⏳ 重要不紧急',
  normal: '📦 不重要不紧急，不干也行'
};

// DOM元素
let categoryMap;

// 主题相关元素
const themeModal = document.getElementById('theme-modal');
const themeButton = document.getElementById('theme-button');
const closeButton = document.querySelector('.close-button');
const themeOptions = document.querySelectorAll('.theme-option');
const totalTasksElement = document.getElementById('total-tasks');

// 加载保存的任务
function loadSavedData() {
  console.log('开始加载数据...');
  
  // 使用同步加载方式，确保数据加载完成后再渲染
  chrome.storage.local.get(['tasks', 'historyTasks', 'categoryTitles', 'currentTheme'], (result) => {
    console.log('从存储中获取所有数据:', result);
    
    // 初始化tasks
    if (result.tasks) {
      console.log('加载保存的tasks:', result.tasks);
      tasks = result.tasks;
    } else {
      console.log('没有保存的tasks，使用默认值');
      tasks = {
        urgentImportant: [],
        important: [],
        normal: []
      };
    }
    
    // 确保tasks结构正确
    if (!Array.isArray(tasks.urgentImportant)) tasks.urgentImportant = [];
    if (!Array.isArray(tasks.important)) tasks.important = [];
    if (!Array.isArray(tasks.normal)) tasks.normal = [];
    
    // 初始化historyTasks
    if (result.historyTasks) {
      console.log('加载保存的historyTasks:', result.historyTasks);
      historyTasks = result.historyTasks;
    } else {
      console.log('没有保存的historyTasks，使用默认值');
      historyTasks = [];
    }
    
    // 确保historyTasks是数组
    if (!Array.isArray(historyTasks)) historyTasks = [];
    
    // 初始化categoryTitles
    if (result.categoryTitles) {
      console.log('加载保存的categoryTitles:', result.categoryTitles);
      categoryTitles = result.categoryTitles;
    }
    
    // 初始化currentTheme
    if (result.currentTheme) {
      console.log('加载保存的currentTheme:', result.currentTheme);
      currentTheme = result.currentTheme;
      applyTheme(currentTheme);
    }
    
    console.log('加载完成后的数据:', {
      tasks: tasks,
      historyTasks: historyTasks,
      categoryTitles: categoryTitles,
      currentTheme: currentTheme
    });
    
    // 渲染所有任务（仅在主页面）
    if (!document.querySelector('#history-list')) {
      renderAllTasks();
    }
  });
}

function addTask(category) {
  console.log('添加任务到分类:', category);
  const input = categoryMap[category].input;
  const text = input.value.trim();
  
  if (text) {
    console.log('添加任务:', text);
    
    // 确保tasks[category]是数组
    if (!tasks[category] || !Array.isArray(tasks[category])) {
      tasks[category] = [];
    }
    
    const newTask = {
      id: Date.now(),
      text,
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    tasks[category].push(newTask);
    console.log('添加后tasks:', tasks);
    
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
  
  // 确保tasks[category]是数组
  if (!tasks[category] || !Array.isArray(tasks[category])) {
    tasks[category] = [];
  }
  
  console.log('渲染分类:', category, '任务数量:', tasks[category].length);
  
  list.innerHTML = tasks[category].map(task => `
    <li class="task-item" data-id="${task.id}">
      <div class="task-content">
        <span class="drag-icon">☰</span>
        <span class="task-text${task.completed ? ' completed' : ''}">${task.text}</span>
        <span class="delete-btn">×</span>
      </div>
      <div class="task-date">${formatDate(task.createdAt)}</div>
    </li>
  `).join('');

  // 绑定事件
  list.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', deleteTask);
  });

  list.querySelectorAll('.task-text').forEach(textElement => {
    textElement.addEventListener('dblclick', handleEditTask);
    textElement.addEventListener('click', toggleTaskComplete);
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
      category: categoryTitles[category],
      deletedAt: Date.now()
    };
    historyTasks.push(historyTask);
  }
  
  saveTasks();
  renderTasks(category);
  updateCategoryBadges();
}

// 切换任务完成状态
function toggleTaskComplete(e) {
  // 防止双击事件触发单击事件
  if (e.detail > 1) return;
  
  const taskItem = e.target.closest('li');
  const category = getTaskCategory(taskItem);
  const taskId = parseInt(taskItem.dataset.id);
  
  const taskIndex = tasks[category].findIndex(t => t.id === taskId);
  if (taskIndex !== -1) {
    const task = tasks[category][taskIndex];
    task.completed = !task.completed;
    
    saveTasks();
    renderTasks(category);
    updateCategoryBadges();
  }
}

function getTaskCategory(taskItem) {
  return Array.from(taskItem.closest('section').classList)
    .find(c => c in categoryMap) || 'normal';
}

function saveTasks() {
  console.log('开始保存数据...');
  
  // 确保tasks对象结构完整
  if (!tasks) {
    tasks = {
      urgentImportant: [],
      important: [],
      normal: []
    };
  }
  
  // 确保tasks结构正确
  if (!Array.isArray(tasks.urgentImportant)) tasks.urgentImportant = [];
  if (!Array.isArray(tasks.important)) tasks.important = [];
  if (!Array.isArray(tasks.normal)) tasks.normal = [];
  
  // 确保historyTasks是数组
  if (!Array.isArray(historyTasks)) historyTasks = [];
  
  const dataToSave = {
    tasks: tasks,
    historyTasks: historyTasks,
    categoryTitles: categoryTitles,
    currentTheme: currentTheme
  };
  
  console.log('要保存的数据:', dataToSave);
  
  // 一次性保存所有数据
  chrome.storage.local.set(dataToSave, (error) => {
    if (error) {
      console.error('数据保存失败:', error);
    } else {
      console.log('数据保存成功');
      // 验证保存是否成功
      chrome.storage.local.get(['tasks', 'historyTasks'], (result) => {
        console.log('保存后验证数据:', {
          tasks: result.tasks,
          historyTasks: result.historyTasks
        });
      });
    }
  });
  
  // 更新任务计数
  if (categoryMap) {
    updateTaskCounts();
    updateCategoryBadges();
  }
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

// 测试存储操作
function testStorage() {
  console.log('开始测试存储操作...');
  
  // 测试写入
  const testData = {
    test: 'test value',
    timestamp: Date.now()
  };
  
  chrome.storage.local.set(testData, (error) => {
    if (error) {
      console.error('测试写入失败:', error);
    } else {
      console.log('测试写入成功');
      
      // 测试读取
      chrome.storage.local.get('test', (result) => {
        if (result.test) {
          console.log('测试读取成功:', result.test);
        } else {
          console.error('测试读取失败');
        }
      });
    }
  });
}

// 初始化渲染
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM加载完成，当前页面:', window.location.href);
  
  // 初始化categoryMap
  categoryMap = {
    urgentImportant: {
      input: document.querySelector('.urgent-important input'),
      button: document.querySelector('.urgent-important .add-button'),
      list: document.querySelector('.urgent-important .task-list'),
      badge: document.querySelector('.urgent-important .category-badge')
    },
    important: {
      input: document.querySelector('.important input'),
      button: document.querySelector('.important .add-button'),
      list: document.querySelector('.important .task-list'),
      badge: document.querySelector('.important .category-badge')
    },
    normal: {
      input: document.querySelector('.category:not(.urgent-important):not(.important) input'),
      button: document.querySelector('.category:not(.urgent-important):not(.important) .add-button'),
      list: document.querySelector('.category:not(.urgent-important):not(.important) .task-list'),
      badge: document.querySelector('.category:not(.urgent-important):not(.important) .category-badge')
    }
  };
  
  console.log('categoryMap初始化:', categoryMap);
  
  // 为每个分类绑定事件
  Object.keys(categoryMap).forEach(category => {
    const { button, input } = categoryMap[category];
    
    if (button) {
      button.addEventListener('click', () => addTask(category));
    }
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask(category);
      });
    }
  });
  
  // 渲染分类标题
  renderCategoryTitles();
  
  // 绑定分类标题编辑事件
  bindCategoryTitleEdit();
  
  // 绑定页脚链接事件
  bindFooterLinks();
  
  // 绑定主题相关事件
  bindThemeEvents();
  
  // 绑定头部按钮事件
  bindHeaderButtons();
  
  // 测试存储操作
  testStorage();
  
  // 加载保存的数据
  loadSavedData();
  
  // 如果是历史任务页面，确保渲染历史任务
  if (document.querySelector('#history-table')) {
    console.log('检测到历史任务页面');
    if (historyTasks.length > 0) {
      renderHistoryTasks();
    }
  }
});

// 绑定主题相关事件
function bindThemeEvents() {
  if (themeButton) {
    themeButton.addEventListener('click', () => {
      themeModal.classList.add('active');
    });
  }
  
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      themeModal.classList.remove('active');
    });
  }
  
  // 点击模态框外部关闭
  if (themeModal) {
    themeModal.addEventListener('click', (e) => {
      if (e.target === themeModal) {
        themeModal.classList.remove('active');
      }
    });
  }
  
  // 主题选项点击
  themeOptions.forEach(option => {
    option.addEventListener('click', () => {
      const theme = option.dataset.theme;
      applyTheme(theme);
      themeModal.classList.remove('active');
    });
  });
}

// 绑定头部按钮事件
function bindHeaderButtons() {
  // 历史记录按钮
  const historyButton = document.getElementById('history-button');
  if (historyButton) {
    historyButton.addEventListener('click', () => {
      window.location.href = 'history.html';
    });
  }
  
  // 导出按钮
  const exportButton = document.getElementById('export-button');
  if (exportButton) {
    exportButton.addEventListener('click', handleExport);
  }
  
  // 导入按钮
  const importButton = document.getElementById('import-button');
  if (importButton) {
    importButton.addEventListener('click', handleImport);
  }
  

}



// 应用主题
function applyTheme(theme) {
  currentTheme = theme;
  document.body.setAttribute('data-theme', theme);
  
  // 更新主题选项的活动状态
  themeOptions.forEach(option => {
    if (option.dataset.theme === theme) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });
  
  // 只在tasks对象有数据时保存，避免覆盖现有数据
  if (tasks && (tasks.urgentImportant || tasks.important || tasks.normal)) {
    saveTasks();
  }
}

// 更新任务计数
function updateTaskCounts() {
  // 计算每个分类的任务数
  const counts = {
    urgentImportant: tasks.urgentImportant.length,
    important: tasks.important.length,
    normal: tasks.normal.length
  };
  
  // 更新分类徽章
  if (categoryMap) {
    Object.keys(categoryMap).forEach(category => {
      if (categoryMap[category].badge) {
        categoryMap[category].badge.textContent = counts[category];
      }
    });
  }
  
  // 更新总任务数
  if (totalTasksElement) {
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    totalTasksElement.textContent = total;
  }
}

// 更新分类徽章
function updateCategoryBadges() {
  updateTaskCounts();
}

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
  const urgentImportantTitle = document.querySelector('.urgent-important h3');
  const importantTitle = document.querySelector('.important h3');
  const normalTitle = document.querySelector('.category:not(.urgent-important):not(.important) h3');
  
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
  const titles = document.querySelectorAll('.category h3');
  
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
    categoryTitles: categoryTitles,
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
          
          // 导入分类标题
          if (importedData.categoryTitles) {
            categoryTitles = importedData.categoryTitles;
            renderCategoryTitles();
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