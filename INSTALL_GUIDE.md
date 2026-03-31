# 简单任务插件安装指南

如果您的Edge浏览器无法识别此扩展，请按照以下步骤操作：

## 1. 在Edge浏览器中启用开发者模式

1. 打开Microsoft Edge浏览器
2. 在地址栏输入：`edge://extensions/`
3. 开启右上角的**开发者模式**开关

## 2. 加载已解压的扩展

1. 点击**加载已解压的扩展程序**按钮
2. 选择本项目所在的文件夹（包含`manifest.json`文件的文件夹）
3. 扩展应该会立即出现在扩展列表中

## 3. 验证扩展是否正常工作

1. 打开一个新标签页（按Ctrl+T）
2. 应该能看到**简单任务**界面
3. 尝试添加一个测试任务

## 4. 如果仍然无法识别

### 检查常见问题：

#### 问题1：Manifest V3兼容性
- 本扩展使用Manifest V3，需要Edge 88或更高版本
- 检查您的Edge浏览器版本：`edge://settings/help`

#### 问题2：扩展权限问题
- 确保扩展有`storage`权限
- 在`edge://extensions/`页面，找到"简单任务"扩展
- 点击"详细信息"
- 确保所有权限都已启用

#### 问题3：调试扩展
1. 在`edge://extensions/`页面找到"简单任务"扩展
2. 点击"详细信息"
3. 开启"允许访问文件URL"选项（如果存在）
4. 点击"服务工作者"链接检查Service Worker状态

## 5. 使用调试工具

项目中包含一个调试页面，可以帮助诊断问题：

1. 在浏览器中打开`debug.html`文件
2. 点击按钮测试各种API功能
3. 根据调试结果采取相应措施

## 6. 手动测试步骤

如果扩展仍然无法工作，可以手动测试：

### 测试Chrome API：
1. 打开浏览器开发者工具（F12）
2. 切换到Console标签页
3. 输入：`console.log(typeof chrome, typeof chrome.storage)`
4. 应该看到：`"object" "object"`

### 检查Service Worker：
1. 访问：`edge://extensions/`
2. 找到"简单任务"扩展
3. 点击"服务工作者"链接
4. 确保Service Worker处于"运行中"状态

## 7. 解决特定错误

### 错误："无法加载扩展程序"
- 检查`manifest.json`格式是否正确
- 确保没有JSON语法错误
- 确保所有引用的文件存在

### 错误："缺少必需的权限"
- 检查`manifest.json`中的`permissions`字段
- 确保只包含必要的权限

### 错误："无法读取Service Worker"
- 检查`service-worker.js`文件是否存在
- 确保文件没有语法错误

## 8. 备用方案

如果上述方法都无法解决问题：

1. **降级到Manifest V2**（不推荐）：
   - 将`manifest_version`改为`2`
   - 移除`background`字段的`type: "module"`
   - 可能需要调整其他配置

2. **重新创建扩展**：
   - 备份项目文件夹
   - 重新从原始源代码加载
   - 确保所有依赖文件完整

## 技术支持

如果问题仍然存在，请：
1. 查看Edge浏览器控制台错误信息
2. 检查Service Worker日志
3. 在GitHub Issues中报告问题

**注意**：本扩展已在Edge浏览器最新版本中测试通过，支持Manifest V3规范。