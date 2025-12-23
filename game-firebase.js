// Firebase 版在线双人对战数独游戏
class SudokuBattleFirebase {
    constructor() {
        this.currentScreen = 'lobby';
        this.playerName = '';
        this.playerId = this.generateId();
        this.roomId = '';
        this.isHost = false;
        this.puzzle = null;
        this.solution = null;
        this.validator = null;
        this.board = null;
        this.selectedCell = null;
        this.fixedCells = new Set();
        this.gameState = 'playing';
        this.roomRef = null;
        this.myPlayerRef = null;
        this.listeners = [];

        this.init();
    }

    generateId() {
        return 'player_' + Math.random().toString(36).substring(2, 15);
    }

    init() {
        this.bindEvents();
        this.showScreen('lobby');
    }

    bindEvents() {
        document.getElementById('createRoom').addEventListener('click', () => this.createRoom());
        document.getElementById('joinRoom').addEventListener('click', () => this.joinRoom());
        document.getElementById('leaveRoom').addEventListener('click', () => this.leaveRoom());
        document.getElementById('backToLobby').addEventListener('click', () => this.backToLobby());

        document.querySelectorAll('.num-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const num = parseInt(e.target.dataset.num);
                this.inputNumber(num);
            });
        });

        document.addEventListener('keydown', (e) => {
            if (this.currentScreen === 'game' && this.gameState === 'playing') {
                if (e.key >= '1' && e.key <= '9') {
                    this.inputNumber(parseInt(e.key));
                } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
                    this.inputNumber(0);
                }
            }
        });
    }

    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenName).classList.add('active');
        this.currentScreen = screenName;
    }

    async createRoom() {
        const nameInput = document.getElementById('playerName');
        this.playerName = nameInput.value.trim();

        if (!this.playerName) {
            alert('请输入你的名字');
            return;
        }

        // 生成房间号
        this.roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.isHost = true;

        // 生成数独谜题
        const generator = new SudokuGenerator();
        const { puzzle, solution } = generator.generatePuzzle('medium');
        this.puzzle = puzzle;
        this.solution = solution;
        this.board = this.copyBoard(puzzle);

        // 创建 Firebase 房间
        this.roomRef = database.ref('rooms/' + this.roomId);

        try {
            await this.roomRef.set({
                created: firebase.database.ServerValue.TIMESTAMP,
                puzzle: puzzle,
                solution: solution,
                status: 'waiting',
                host: {
                    id: this.playerId,
                    name: this.playerName,
                    board: this.board,
                    state: 'playing',
                    progress: 0
                },
                guest: null
            });

            this.showWaitingScreen();
            this.listenForGuest();
        } catch (error) {
            alert('创建房间失败：' + error.message);
        }
    }

    async joinRoom() {
        const nameInput = document.getElementById('playerName');
        const roomInput = document.getElementById('roomId');
        this.playerName = nameInput.value.trim();
        this.roomId = roomInput.value.trim().toUpperCase();

        if (!this.playerName) {
            alert('请输入你的名字');
            return;
        }

        if (!this.roomId) {
            alert('请输入房间号');
            return;
        }

        this.roomRef = database.ref('rooms/' + this.roomId);

        try {
            // 检查房间是否存在
            const snapshot = await this.roomRef.once('value');
            const room = snapshot.val();

            if (!room) {
                alert('房间不存在');
                return;
            }

            if (room.guest) {
                alert('房间已满');
                return;
            }

            if (room.status !== 'waiting') {
                alert('游戏已开始');
                return;
            }

            this.isHost = false;
            this.puzzle = room.puzzle;
            this.solution = room.solution;
            this.board = this.copyBoard(this.puzzle);

            // 加入房间
            await this.roomRef.child('guest').set({
                id: this.playerId,
                name: this.playerName,
                board: this.board,
                state: 'playing',
                progress: 0
            });

            await this.roomRef.child('status').set('playing');

            this.showWaitingScreen();

            setTimeout(() => {
                this.startGame();
            }, 1500);
        } catch (error) {
            alert('加入房间失败：' + error.message);
        }
    }

    listenForGuest() {
        const guestRef = this.roomRef.child('guest');
        const listener = guestRef.on('value', (snapshot) => {
            const guest = snapshot.val();
            if (guest) {
                document.getElementById('player2Name').textContent = guest.name;
                document.querySelector('.player-slot:last-child .status').classList.remove('waiting');
                document.querySelector('.player-slot:last-child .status').classList.add('ready');

                // 移除监听器
                guestRef.off('value', listener);

                setTimeout(() => {
                    this.startGame();
                }, 1500);
            }
        });

        this.listeners.push({ ref: guestRef, event: 'value', callback: listener });
    }

    showWaitingScreen() {
        document.getElementById('currentRoom').textContent = this.roomId;

        this.roomRef.once('value').then((snapshot) => {
            const room = snapshot.val();
            if (this.isHost) {
                document.getElementById('player1Name').textContent = this.playerName;
                document.getElementById('player2Name').textContent = room.guest ? room.guest.name : '等待中...';
            } else {
                document.getElementById('player1Name').textContent = room.host.name;
                document.getElementById('player2Name').textContent = this.playerName;
            }
        });

        this.showScreen('waiting');
    }

    async leaveRoom() {
        // 清理监听器
        this.listeners.forEach(({ ref, event, callback }) => {
            ref.off(event, callback);
        });
        this.listeners = [];

        if (this.isHost && this.roomRef) {
            // 房主删除房间
            await this.roomRef.remove();
        } else if (this.roomRef) {
            // 客人离开房间
            await this.roomRef.child('guest').remove();
            await this.roomRef.child('status').set('waiting');
        }

        this.roomRef = null;
        this.showScreen('lobby');
    }

    async startGame() {
        const snapshot = await this.roomRef.once('value');
        const room = snapshot.val();

        if (!room || !room.guest) {
            alert('对手已离开');
            this.backToLobby();
            return;
        }

        this.validator = new SudokuValidator(this.solution);
        this.gameState = 'playing';

        this.fixedCells.clear();
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.puzzle[row][col] !== 0) {
                    this.fixedCells.add(`${row}-${col}`);
                }
            }
        }

        document.getElementById('gamePlayer1Name').textContent = room.host.name;
        document.getElementById('gamePlayer2Name').textContent = room.guest.name;

        this.renderBoard();
        this.showScreen('game');

        // 开始监听对手状态
        this.listenToOpponent();

        // 更新自己的进度
        this.updateMyProgress();
    }

    listenToOpponent() {
        const opponentPath = this.isHost ? 'guest' : 'host';
        const opponentRef = this.roomRef.child(opponentPath);

        const listener = opponentRef.on('value', (snapshot) => {
            const opponent = snapshot.val();
            if (!opponent) {
                // 对手离开了
                if (this.currentScreen === 'game') {
                    alert('对手已离开游戏');
                    this.backToLobby();
                }
                return;
            }

            // 更新对手显示
            const opponentIndex = this.isHost ? 2 : 1;
            document.getElementById(`player${opponentIndex}Progress`).textContent =
                `${opponent.progress}/81`;

            const stateElement = document.getElementById(`player${opponentIndex}State`);
            stateElement.textContent =
                opponent.state === 'playing' ? '进行中' :
                opponent.state === 'failed' ? '失败' : '完成';
            stateElement.className =
                `player-state ${opponent.state === 'playing' ? 'playing' :
                opponent.state === 'failed' ? 'failed' : 'won'}`;

            // 检查游戏结束条件
            if (this.gameState === 'playing' && opponent.state === 'won') {
                this.gameState = 'lost';
                setTimeout(() => {
                    this.endGame(false);
                }, 500);
            }
        });

        this.listeners.push({ ref: opponentRef, event: 'value', callback: listener });
    }

    renderBoard() {
        const boardElement = document.getElementById('sudokuBoard');
        boardElement.innerHTML = '';

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                const value = this.board[row][col];
                if (value !== 0) {
                    cell.textContent = value;
                }

                if (this.fixedCells.has(`${row}-${col}`)) {
                    cell.classList.add('fixed');
                } else {
                    cell.classList.add('editable');
                    cell.addEventListener('click', () => this.selectCell(row, col));
                }

                boardElement.appendChild(cell);
            }
        }
    }

    selectCell(row, col) {
        if (this.gameState !== 'playing') return;
        if (this.fixedCells.has(`${row}-${col}`)) return;

        this.selectedCell = { row, col };

        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('selected');
        });

        const cellElement = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        cellElement.classList.add('selected');
    }

    async inputNumber(num) {
        if (!this.selectedCell || this.gameState !== 'playing') return;

        const { row, col } = this.selectedCell;
        if (this.fixedCells.has(`${row}-${col}`)) return;

        this.board[row][col] = num;

        const cellElement = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        cellElement.textContent = num === 0 ? '' : num;
        cellElement.classList.remove('error');

        if (num !== 0) {
            if (!this.validator.validateCell(row, col, num)) {
                cellElement.classList.add('error');
                this.gameState = 'failed';

                // 更新 Firebase
                await this.updateMyState('failed');

                setTimeout(() => {
                    this.endGame(false);
                }, 800);
                return;
            }

            if (this.validator.isComplete(this.board)) {
                this.gameState = 'won';

                // 更新 Firebase
                await this.updateMyState('won');

                setTimeout(() => {
                    this.endGame(true);
                }, 500);
                return;
            }
        }

        // 更新进度
        await this.updateMyProgress();
    }

    async updateMyProgress() {
        const progress = this.validator.getProgress(this.board);
        const myPath = this.isHost ? 'host' : 'guest';

        await this.roomRef.child(myPath).update({
            board: this.board,
            progress: progress
        });

        // 更新本地显示
        const myIndex = this.isHost ? 1 : 2;
        document.getElementById(`player${myIndex}Progress`).textContent = `${progress}/81`;
    }

    async updateMyState(state) {
        const myPath = this.isHost ? 'host' : 'guest';
        await this.roomRef.child(myPath).update({
            state: state
        });
    }

    async endGame(won) {
        // 清理监听器
        this.listeners.forEach(({ ref, event, callback }) => {
            ref.off(event, callback);
        });
        this.listeners = [];

        const resultTitle = document.getElementById('resultTitle');
        const resultMessage = document.getElementById('resultMessage');

        if (won) {
            resultTitle.textContent = '你赢了！';
            resultTitle.className = 'win';
            resultMessage.textContent = '恭喜！你成功完成了数独并击败了对手！';
        } else {
            if (this.gameState === 'failed') {
                resultTitle.textContent = '你输了';
                resultTitle.className = 'lose';
                resultMessage.textContent = '很遗憾，你填错了数字。再接再厉！';
            } else {
                resultTitle.textContent = '你输了';
                resultTitle.className = 'lose';
                resultMessage.textContent = '对手先完成了数独。下次加油！';
            }
        }

        this.showScreen('result');
    }

    async backToLobby() {
        // 清理监听器
        this.listeners.forEach(({ ref, event, callback }) => {
            ref.off(event, callback);
        });
        this.listeners = [];

        // 清理房间
        if (this.isHost && this.roomRef) {
            await this.roomRef.remove();
        }

        this.selectedCell = null;
        this.board = null;
        this.fixedCells.clear();
        this.gameState = 'playing';
        this.roomRef = null;

        this.showScreen('lobby');
    }

    copyBoard(board) {
        return board.map(row => [...row]);
    }
}

// 初始化游戏
window.addEventListener('DOMContentLoaded', () => {
    // 检查 Firebase 是否已初始化
    if (typeof firebase === 'undefined') {
        alert('Firebase 未正确加载，请检查配置！');
        return;
    }

    new SudokuBattleFirebase();
});
