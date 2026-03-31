@echo off
echo ============================================
echo 简单任务插件完整性测试
echo ============================================
echo.

echo 1. 检查必需文件是否存在...
if exist manifest.json (
    echo   ✅ manifest.json 存在
) else (
    echo   ❌ 错误：找不到 manifest.json
    exit /b 1
)

if exist script.js (
    echo   ✅ script.js 存在
) else (
    echo   ❌ 错误：找不到 script.js
    exit /b 1
)

if exist service-worker.js (
    echo   ✅ service-worker.js 存在
) else (
    echo   ❌ 错误：找不到 service-worker.js
    exit /b 1
)

if exist newtab.html (
    echo   ✅ newtab.html 存在
) else (
    echo   ❌ 错误：找不到 newtab.html
    exit /b 1
)

echo.
echo 2. 检查图标文件...
set icon_count=0
for %%i in (icons/*.png) do set /a icon_count+=1
echo   找到 %icon_count% 个图标文件

if %icon_count% GEQ 4 (
    echo   ✅ 图标文件足够
) else (
    echo   ⚠️  警告：图标文件可能不足
)

echo.
echo 3. 检查manifest.json格式...
python -c "import json; f=open('manifest.json'); json.load(f); f.close(); print('  ✅ manifest.json 格式正确')" 2>nul
if errorlevel 1 (
    echo   ❌ 错误：manifest.json 格式不正确
    echo   请运行：python -m json.tool manifest.json
)

echo.
echo 4. 检查文件大小...
for /f "tokens=1-3" %%a in ('powershell -command "Get-ChildItem -File | Select-Object Name, @{Name='Size';Expression={[math]::Round($_.Length/1KB, 2)}} | Format-Table -AutoSize | Out-String"') do (
    if not "%%a"=="Name" (
        echo   %%a: %%b KB
    )
)

echo.
echo ============================================
echo 测试完成！
echo.
echo 如果所有检查都通过，扩展应该可以正常加载。
echo.
echo 安装步骤：
echo 1. 打开 Edge 浏览器
echo 2. 访问 edge://extensions/
echo 3. 开启开发者模式
echo 4. 点击"加载已解压的扩展程序"
echo 5. 选择当前文件夹
echo ============================================
pause