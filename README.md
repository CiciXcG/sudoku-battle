# 双人对战数独游戏

一个支持真正在线双人对战的数独游戏，两名玩家通过房间号进行匹配，挑战相同的中等难度数独题目。

## 游戏特点

- 真正的在线双人对战（使用 LocalStorage 同步）
- 自动生成中等难度数独题目（50个��格）
- 实时错误检测 - 填错立即判负
- 实时显示双方进度
- 无错误且先完成者获胜
- 响应式设计，支持手机和电脑

## 如何游玩

### 在线游玩

访问游戏网址：`https://你的用户名.github.io/sudoku-battle/`

### 游戏流程

1. 输入你的名字
2. **创建房间** 或 **加入房间**（输入6位房间号）
3. 等待对手加入
4. 开始挑战数独：
   - 点击空格选中
   - 使用数字键盘或键盘数字键（1-9）输入
   - 按 0/Backspace/Delete 清除
5. 填错即判负，无错误且先完成者获胜

## 部署到 GitHub Pages

### 步骤 1：创建 GitHub 仓库

1. 登录 [GitHub](https://github.com)
2. 点击右上角 `+` → `New repository`
3. 仓库名填写：`sudoku-battle`
4. 选择 `Public`（公开）
5. 点击 `Create repository`

### 步骤 2：上传文件

有两种方式：

#### 方式 A：通过网页上传（推荐新手）

1. 在新创建的仓库页面，点击 `uploading an existing file`
2. 将这些文件拖入上传区：
   - `index.html`
   - `style.css`
   - `sudoku.js`
   - `game-online.js`
   - `README.md`
3. 在底部填写提交信息：`Initial commit`
4. 点击 `Commit changes`

#### 方式 B：通过 Git 命令行

在 `sudoku-battle` 文件夹中打开命令行，运行：

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/sudoku-battle.git
git push -u origin main
```

### 步骤 3：启用 GitHub Pages

1. 进入仓库页面
2. 点击 `Settings`（设置）
3. 左侧菜单找到 `Pages`
4. 在 `Source` 下拉菜单选择 `main` 分支
5. 点击 `Save`
6. 等待 1-2 分钟，页面会显示访问地址：
   ```
   https://你的用户名.github.io/sudoku-battle/
   ```

### 步骤 4：分享给朋友

复制游戏网址发送给朋友即可！

## 技术说明

### 在线对战实现

由于 GitHub Pages 只支持静态文件，游戏使用以下方案实现在线对战：

- **LocalStorage 同步**：玩家在同一浏览器中通过定期读写 LocalStorage 实现状态同步
- **适用场景**：适合在同一台电脑上测试，或通过屏幕共享进行游戏

### 完全在线对战方案

如果需要支持不同电脑的玩家对战，可以使用以下方案：

1. **Firebase Realtime Database**（推荐）
   - 免费额度充足
   - 实时同步
   - 配置简单

2. **自建 WebSocket 服务器**
   - 需要服务器
   - 完全控制

3. **PeerJS（P2P）**
   - 点对点连接
   - 无需服务器

## 文件说明

- `index.html` - 主页面
- `style.css` - 样式文件
- `sudoku.js` - 数独生成和验证逻辑
- `game-online.js` - 在线对战游戏逻辑
- `game.js` - 单机模拟对战版本（已废弃）
- `README.md` - 说明文档

## 本地运行

直接双击 `index.html` 即可在浏览器中打开游戏。

如果需要本地服务器：

```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server -p 8000
```

然后访问 `http://localhost:8000`

## 游戏规则

- 数独是 9×9 格的数字谜题
- 每行、每列、每个 3×3 宫格内数字 1-9 各出现一次
- 填错任何数字立即判负
- 双方挑战相同题目，先无错误完成者获胜

## 开源协议

MIT License

---

祝你游戏愉快！Have fun!
