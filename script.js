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
let categoryMap;

// Sortable实例存储
let sortables = {};

// 加载保存的任务
function loadSavedData() {
  console.log('开始加载数据...');
  
  // 在DOM加载完成后获取DOM元素
  categoryMap = {
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
  
  console.log('categoryMap:', categoryMap);
  
  // 先加载历史记录数据，确保在保存任务数据时不会丢失
  try {
    const historyTasksData = localStorage.getItem('historyTasks');
    if (historyTasksData) {
      historyTasks = JSON.parse(historyTasksData);
      console.log('预加载历史记录数据:', historyTasks);
    } else {
      historyTasks = [];
    }
  } catch (error) {
    console.error('预加载历史记录数据失败:', error);
    historyTasks = [];
  }
  
  // 加载分类标题数据
  try {
    const categoryTitlesData = localStorage.getItem('categoryTitles');
    if (categoryTitlesData) {
      categoryTitles = JSON.parse(categoryTitlesData);
    }
  } catch (error) {
    console.error('加载分类标题数据失败:', error);
  }
  
  // 现在处理任务数据
  try {
    const tasksData = localStorage.getItem('tasks');
    console.log('从localStorage加载的tasks数据:', tasksData);
    
    if (tasksData) {
      // 先备份原始数据，以便调试
      const originalTasksData = tasksData;
      const parsedData = JSON.parse(tasksData);
      console.log('解析后的原始数据:', parsedData);
      
      // 检查数据结构
      console.log('原始数据类型:', typeof parsedData);
      
      // 数据迁移：尝试将旧格式转换为新格式
      if (Array.isArray(parsedData)) {
        // 旧格式：直接是一个任务数组
        console.log('检测到旧格式数据（数组），正在迁移...');
        tasks = {
          urgentImportant: [],
          important: [],
          normal: parsedData // 将所有旧任务放在normal分类中
        };
      } else if (typeof parsedData === 'object') {
        // 检查是否有旧的分类名称
        if (parsedData.todoList) {
          console.log('检测到旧格式数据（todoList），正在迁移...');
          tasks = {
            urgentImportant: [],
            important: [],
            normal: parsedData.todoList || []
          };
        } else if (parsedData.tasks) {
          console.log('检测到旧格式数据（tasks），正在迁移...');
          tasks = {
            urgentImportant: parsedData.tasks.urgentImportant || [],
            important: parsedData.tasks.important || [],
            normal: parsedData.tasks.normal || []
          };
        } else {
          // 新格式：直接使用
          tasks = parsedData;
        }
      }
      
      console.log('迁移后的数据:', tasks);
      
      // 确保tasks对象的每个分类都是数组
      if (!tasks.urgentImportant || !Array.isArray(tasks.urgentImportant)) {
        console.log('修复urgentImportant分类数据');
        tasks.urgentImportant = [];
      }
      if (!tasks.important || !Array.isArray(tasks.important)) {
        console.log('修复important分类数据');
        tasks.important = [];
      }
      if (!tasks.normal || !Array.isArray(tasks.normal)) {
        console.log('修复normal分类数据');
        tasks.normal = [];
      }
      
      // 确保每个任务都有必要的属性
      Object.keys(tasks).forEach(category => {
        tasks[category] = tasks[category].map(task => {
          if (typeof task === 'string') {
            // 旧格式：任务是字符串
            return {
              id: Date.now() + Math.random(),
              text: task,
              completed: false,
              createdAt: Date.now()
            };
          } else {
            // 确保任务对象有必要的属性
            return {
              id: task.id || Date.now() + Math.random(),
              text: task.text || '',
              completed: task.completed || false,
              createdAt: task.createdAt || Date.now(),
              reminder: task.reminder // 保留提醒信息
            };
          }
        });
      });
      
      console.log('最终修复后的数据:', tasks);
      
      // 保存修复后的数据，此时历史记录数据已经加载，不会被覆盖
      console.log('保存修复后的数据，历史记录数量:', historyTasks.length);
      saveTasks();
    }
    
    // 渲染所有任务
    renderAllTasks();
  } catch (error) {
    console.error('加载任务数据失败:', error);
    // 渲染所有任务
    renderAllTasks();
  }
  
  // 历史记录和分类标题数据已经在函数前面预加载，此处不再重复加载
}

// 保存任务
function saveTasks() {
  try {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('historyTasks', JSON.stringify(historyTasks));
    localStorage.setItem('categoryTitles', JSON.stringify(categoryTitles));
    console.log('数据已保存到localStorage');
    console.log('保存的历史记录数量:', historyTasks.length);
    console.log('保存的历史记录内容:', historyTasks);
  } catch (error) {
    console.error('保存数据失败:', error);
    console.error('错误详情:', error.stack);
  }
}

// 渲染所有任务
function renderAllTasks() {
  console.log('开始渲染所有任务...');
  console.log('当前tasks数据:', tasks);
  renderTasks('urgentImportant');
  renderTasks('important');
  renderTasks('normal');
  console.log('所有任务渲染完成');
}

// 渲染任务
function renderTasks(category) {
  console.log(`渲染任务分类: ${category}`);
  
  if (!categoryMap) {
    console.error('categoryMap未定义');
    return;
  }
  
  if (!categoryMap[category]) {
    console.error(`categoryMap[${category}]不存在`, categoryMap);
    return;
  }
  
  const list = categoryMap[category].list;
  if (!list) {
    console.error(`categoryMap[${category}].list不存在`, categoryMap[category]);
    return;
  }
  
  // 检查tasks对象和当前分类的数据
  console.log('当前tasks对象:', tasks);
  console.log('当前分类:', category);
  console.log('当前分类的任务数据:', tasks[category]);
  
  const tasksList = tasks[category] || [];
  console.log(`分类 ${category} 准备渲染的任务列表:`, tasksList);
  console.log(`分类 ${category} 的任务数量:`, tasksList.length);
  
  list.innerHTML = tasksList.map(task => {
    return `
      <li class="task-item" data-id="${task.id}">
    <span class="drag-icon">☰</span>
    <span class="task-text ${task.completed ? 'completed' : ''}">${task.text}</span>
    <div class="task-header">
      <span class="delete-btn">×</span>
    </div>
  </li>
    `;
  }).join('');
  
  // 绑定事件
  list.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', deleteTask);
  });
  
  // 为任务卡片添加双击事件，双击除删除按钮外的任何地方都弹出编辑对话框
  list.querySelectorAll('.task-item').forEach(item => {
    item.addEventListener('dblclick', (e) => {
      // 如果点击的是删除按钮或删除按钮的父元素，不执行编辑功能
      if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
        return;
      }
      // 打开编辑模态框
      openEditModal(e);
    });
  });
  
  // 移除任务文本的点击事件，不再修改完成状态
  // list.querySelectorAll('.task-text').forEach(text => {
  //   text.addEventListener('click', toggleTaskComplete);
  // });
  
  // 初始化SortableJS（只初始化一次）
  if (!sortables[category]) {
    sortables[category] = new Sortable(list, {
      group: 'tasks',
      animation: 150,
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',
      chosenClass: 'sortable-chosen',
      onEnd: handleTaskMove
    });
  }
}

// 删除任务
function deleteTask(e) {
  const taskItem = e.target.closest('li');
  const category = getTaskCategory(taskItem);
  const taskId = parseInt(taskItem.dataset.id);
  
  console.log('开始删除任务:', taskId, '分类:', category);
  
  if (!confirm('确定要删除这个任务吗？')) return;
  
  const taskIndex = tasks[category].findIndex(t => t.id === taskId);
  if (taskIndex !== -1) {
    const task = tasks[category][taskIndex];
    console.log('找到要删除的任务:', task);
    
    tasks[category].splice(taskIndex, 1);
    
    // 添加到历史记录
    const historyTask = {
      ...task,
      category: category, // 保存实际的分类键名，而不是分类标题
      deletedAt: Date.now()
    };
    
    console.log('添加到历史记录的任务:', historyTask);
    historyTasks.push(historyTask);
    console.log('添加后历史记录数量:', historyTasks.length);
  }
  
  console.log('准备保存数据...');
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
  console.log(`添加任务到分类: ${category}`);
  
  if (!categoryMap[category]) {
    console.error(`categoryMap[${category}]不存在`);
    return;
  }
  
  const input = categoryMap[category].input;
  if (!input) {
    console.error(`categoryMap[${category}].input不存在`);
    return;
  }
  
  const text = input.value.trim();
  
  if (!text) return;
  
  const task = {
    id: Date.now(),
    text: text,
    completed: false,
    createdAt: Date.now()
  };
  
  // 确保tasks[category]是数组
  if (!tasks[category]) {
    tasks[category] = [];
  }
  
  tasks[category].push(task);
  input.value = '';
  
  saveTasks();
  renderTasks(category);
  console.log(`任务已添加到分类 ${category}:`, task);
}

// 绑定添加任务事件
function bindAddTaskEvents() {
  console.log('绑定添加任务事件...');
  
  // 确保categoryMap已经定义
  if (!categoryMap) {
    console.error('categoryMap未定义');
    return;
  }
  
  // 绑定urgentImportant分类的事件
  if (categoryMap.urgentImportant && categoryMap.urgentImportant.button) {
    categoryMap.urgentImportant.button.addEventListener('click', () => addTask('urgentImportant'));
  } else {
    console.error('categoryMap.urgentImportant.button不存在');
  }
  
  if (categoryMap.urgentImportant && categoryMap.urgentImportant.input) {
    categoryMap.urgentImportant.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addTask('urgentImportant');
    });
  } else {
    console.error('categoryMap.urgentImportant.input不存在');
  }

  // 绑定important分类的事件
  if (categoryMap.important && categoryMap.important.button) {
    categoryMap.important.button.addEventListener('click', () => addTask('important'));
  } else {
    console.error('categoryMap.important.button不存在');
  }
  
  if (categoryMap.important && categoryMap.important.input) {
    categoryMap.important.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addTask('important');
    });
  } else {
    console.error('categoryMap.important.input不存在');
  }

  // 绑定normal分类的事件
  if (categoryMap.normal && categoryMap.normal.button) {
    categoryMap.normal.button.addEventListener('click', () => addTask('normal'));
  } else {
    console.error('categoryMap.normal.button不存在');
  }
  
  if (categoryMap.normal && categoryMap.normal.input) {
    categoryMap.normal.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addTask('normal');
    });
  } else {
    console.error('categoryMap.normal.input不存在');
  }
}

// 绑定历史任务链接事件
function bindFooterEvents() {
  const historyLink = document.getElementById('history-link');
  const exportLink = document.getElementById('export-link');
  const importLink = document.getElementById('import-link');
  
  // 历史记录功能已在头部按钮实现，此处不再需要
  if (historyLink) {
    // 移除可能存在的旧事件监听器
    historyLink.onclick = null;
  }

  if (exportLink) {
    exportLink.addEventListener('click', (e) => {
      e.preventDefault();
      // 导出包含任务和历史记录的完整数据
      const exportData = {
        tasks: tasks,
        historyTasks: historyTasks,
        categoryTitles: categoryTitles
      };
      const data = JSON.stringify(exportData, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tasks_backup.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  } else {
    console.error('exportLink不存在');
  }

  if (importLink) {
    importLink.addEventListener('click', (e) => {
      e.preventDefault();
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const importedData = JSON.parse(event.target.result);
              
              // 检查导入数据的格式
              if (importedData.tasks) {
                // 新格式：包含tasks, historyTasks, categoryTitles
                tasks = importedData.tasks;
                
                // 导入历史记录（如果存在）
                if (importedData.historyTasks) {
                  historyTasks = importedData.historyTasks;
                }
                
                // 导入分类标题（如果存在）
                if (importedData.categoryTitles) {
                  categoryTitles = importedData.categoryTitles;
                }
              } else {
                // 旧格式：只包含任务数据
                tasks = importedData;
              }
              
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
  } else {
    console.error('importLink不存在');
  }
}

// 编辑任务相关元素
let currentEditingTask = null;
let currentEditingCategory = null;

// 打开编辑模态框
function openEditModal(e) {
  const taskItem = e.target.closest('li');
  const taskId = parseInt(taskItem.dataset.id);
  const category = getTaskCategory(taskItem);
  
  const task = tasks[category].find(t => t.id === taskId);
  if (!task) return;
  
  // 保存当前编辑的任务信息
  currentEditingTask = task;
  currentEditingCategory = category;
  
  // 填充表单数据
  const textarea = document.getElementById('task-textarea');
  textarea.value = task.text;
  
  // 显示模态框
  const modal = document.getElementById('edit-modal');
  modal.style.display = 'block';
  
  // 添加ESC键监听
  const handleEscKey = (event) => {
    if (event.key === 'Escape') {
      closeEditModal();
    }
  };
  
  // 保存事件监听函数引用，以便后续移除
  modal._escKeyHandler = handleEscKey;
  
  // 添加键盘事件监听
  document.addEventListener('keydown', handleEscKey);
}

// 关闭编辑模态框
function closeEditModal() {
  const modal = document.getElementById('edit-modal');
  modal.style.display = 'none';
  
  // 移除ESC键监听
  if (modal._escKeyHandler) {
    document.removeEventListener('keydown', modal._escKeyHandler);
    modal._escKeyHandler = null;
  }
  
  // 重置当前编辑信息
  currentEditingTask = null;
  currentEditingCategory = null;
}

// 打开历史记录模态框
function openHistoryModal() {
  const modal = document.getElementById('history-modal');
  modal.style.display = 'block';
  
  console.log('打开历史记录模态框');
  console.log('当前历史记录数量:', historyTasks.length);
  console.log('当前历史记录内容:', historyTasks);
  
  // 加载历史记录
  loadHistoryRecords();
  
  // 添加ESC键监听
  const handleEscKey = (event) => {
    if (event.key === 'Escape') {
      closeHistoryModal();
    }
  };
  
  // 保存事件监听函数引用，以便后续移除
  modal._escKeyHandler = handleEscKey;
  
  // 添加键盘事件监听
  document.addEventListener('keydown', handleEscKey);
}

// 关闭历史记录模态框
function closeHistoryModal() {
  const modal = document.getElementById('history-modal');
  modal.style.display = 'none';
  
  // 移除ESC键监听
  if (modal._escKeyHandler) {
    document.removeEventListener('keydown', modal._escKeyHandler);
    modal._escKeyHandler = null;
  }
}

// 格式化日期为xxxx年xx月xx日格式
function formatDate(dateTime) {
  const date = new Date(dateTime);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日`;
}

// 加载历史记录
function loadHistoryRecords() {
  const tableBody = document.getElementById('history-table-body');
  
  // 清空表格内容
  tableBody.innerHTML = '';
  
  // 如果没有历史记录
  if (historyTasks.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #999;">暂无历史记录</td></tr>';
    return;
  }
  
  // 按删除日期降序排序
  const sortedTasks = [...historyTasks].sort((a, b) => b.deletedAt - a.deletedAt);
  
  // 生成表格行
  sortedTasks.forEach(task => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatDate(task.createdAt)}</td>
      <td>${formatDate(task.deletedAt)}</td>
      <td class="task-content">${task.text}</td>
      <td>
        <button class="history-btn restore-btn" data-id="${task.id}">恢复</button>
        <button class="history-btn delete-forever-btn" data-id="${task.id}">彻底删除</button>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
  
  // 绑定按钮事件
  bindHistoryButtons();
  
  // 绑定一键清空按钮事件
  const clearHistoryBtn = document.getElementById('clear-history-btn');
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', clearHistory);
  }
}

// 绑定历史记录按钮事件
function bindHistoryButtons() {
  // 恢复按钮事件
  document.querySelectorAll('.restore-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const taskId = parseInt(e.target.dataset.id);
      restoreTask(taskId);
    });
  });
  
  // 彻底删除按钮事件
  document.querySelectorAll('.delete-forever-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const taskId = parseInt(e.target.dataset.id);
      deleteTaskForever(taskId);
    });
  });
}

// 恢复任务
function restoreTask(taskId) {
  // 查找要恢复的任务
  const taskIndex = historyTasks.findIndex(task => task.id === taskId);
  if (taskIndex === -1) return;
  
  console.log('开始恢复任务:', taskId);
  
  const task = historyTasks[taskIndex];
  console.log('要恢复的任务:', task);
  
  // 从历史记录中移除
  historyTasks.splice(taskIndex, 1);
  
  // 添加到当前任务列表
  const category = task.category || 'normal'; // 历史记录中保存的是实际的分类键名
  
  console.log('恢复到分类:', category);
  
  if (!tasks[category]) {
    tasks[category] = [];
  }
  
  // 移除deletedAt和category属性
  delete task.deletedAt;
  delete task.category;
  
  tasks[category].push(task);
  console.log('恢复后任务列表:', tasks[category]);
  
  // 保存数据
  console.log('准备保存恢复后的数据...');
  saveTasks();
  
  // 重新渲染任务和历史记录
  renderTasks(category);
  loadHistoryRecords();
}

// 彻底删除任务
function deleteTaskForever(taskId) {
  if (confirm('确定要彻底删除这个任务吗？此操作不可恢复。')) {
    // 从历史记录中移除
    const taskIndex = historyTasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      historyTasks.splice(taskIndex, 1);
      
      // 保存数据
      saveTasks();
      
      // 重新加载历史记录
      loadHistoryRecords();
    }
  }
}

// 一键清空历史记录
function clearHistory() {
  if (historyTasks.length === 0) {
    alert('历史记录已经是空的');
    return;
  }
  
  if (confirm('确定要清空所有历史记录吗？此操作不可恢复。')) {
    // 清空历史记录
    historyTasks = [];
    
    // 保存数据
    saveTasks();
    
    // 重新加载历史记录
    loadHistoryRecords();
    
    alert('历史记录已清空');
  }
}



// 保存编辑的任务
function saveEditedTask() {
  if (!currentEditingTask || !currentEditingCategory) return;
  
  const textarea = document.getElementById('task-textarea');
  
  // 更新任务内容
  currentEditingTask.text = textarea.value.trim();
  
  // 保存并重新渲染
  saveTasks();
  renderTasks(currentEditingCategory);
  closeEditModal();
}



// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM加载完成，开始初始化...');
  
  // 检查localStorage是否可用
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    console.log('localStorage可用');
  } catch (error) {
    console.error('localStorage不可用:', error);
  }
  
  loadSavedData();
  
  // 绑定模态框事件
  const editModal = document.getElementById('edit-modal');
  const closeBtn = editModal.querySelector('.close');
  const cancelBtn = document.getElementById('cancel-btn');
  const saveBtn = document.getElementById('save-btn');
  
  // 关闭模态框事件
  closeBtn.addEventListener('click', closeEditModal);
  cancelBtn.addEventListener('click', closeEditModal);
  
  // 移除点击模态框外部关闭的功能，只能通过按钮关闭
  // window.addEventListener('click', (e) => {
  //   if (e.target === editModal) {
  //     closeEditModal();
  //   }
  // });
  
  // 保存任务事件
  saveBtn.addEventListener('click', saveEditedTask);
  
  // 绑定历史记录按钮事件
  const historyBtn = document.getElementById('history-link');
  historyBtn.addEventListener('click', openHistoryModal);
  
  // 绑定历史记录模态框事件
  const historyModal = document.getElementById('history-modal');
  const historyCloseBtn = historyModal.querySelector('.close');
  const historyCancelBtn = document.getElementById('history-close-btn');
  
  historyCloseBtn.addEventListener('click', closeHistoryModal);
  historyCancelBtn.addEventListener('click', closeHistoryModal);
  
  // 移除点击模态框外部关闭的功能，只能通过按钮关闭
  // window.addEventListener('click', (e) => {
  //   if (e.target === historyModal) {
  //     closeHistoryModal();
  //   }
  // });
  
  // 确保在loadSavedData之后调用bindAddTaskEvents
  setTimeout(() => {
    bindAddTaskEvents();
    bindFooterEvents();
    console.log('初始化完成');
    console.log('初始化完成后历史记录数量:', historyTasks.length);
    console.log('初始化完成后localStorage中的历史记录:', localStorage.getItem('historyTasks'));
  }, 100);
  
});