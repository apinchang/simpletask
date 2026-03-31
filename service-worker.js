// 简单任务管理插件的Service Worker
console.log('简单任务插件Service Worker已加载');

// 监听安装事件
chrome.runtime.onInstalled.addListener(() => {
    console.log('简单任务插件已安装');
});

// 监听扩展图标点击事件
chrome.action.onClicked.addListener(() => {
    console.log('扩展图标被点击');
    // 可以在这里添加逻辑，比如打开新标签页
});