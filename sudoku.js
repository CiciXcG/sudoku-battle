// 数独生成和验证逻辑
class SudokuGenerator {
    constructor() {
        this.board = Array(9).fill(null).map(() => Array(9).fill(0));
    }

    // 生成完整的数独解决方案
    generateSolution() {
        this.board = Array(9).fill(null).map(() => Array(9).fill(0));
        this.fillBoard(0, 0);
        return this.board;
    }

    // 递归填充数独板
    fillBoard(row, col) {
        if (col === 9) {
            row++;
            col = 0;
        }
        if (row === 9) {
            return true;
        }

        const numbers = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (let num of numbers) {
            if (this.isValid(row, col, num)) {
                this.board[row][col] = num;
                if (this.fillBoard(row, col + 1)) {
                    return true;
                }
                this.board[row][col] = 0;
            }
        }
        return false;
    }

    // 检查数字是否可以放置在指定位置
    isValid(row, col, num) {
        // 检查行
        for (let x = 0; x < 9; x++) {
            if (this.board[row][x] === num) {
                return false;
            }
        }

        // 检查列
        for (let x = 0; x < 9; x++) {
            if (this.board[x][col] === num) {
                return false;
            }
        }

        // 检查3x3宫格
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (this.board[startRow + i][startCol + j] === num) {
                    return false;
                }
            }
        }

        return true;
    }

    // 洗牌算法
    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    // 生成谜题（移除一些数字）
    generatePuzzle(difficulty = 'medium') {
        this.generateSolution();
        const puzzle = this.board.map(row => [...row]);

        // 难度级别对应移除的格子数量
        const removeCount = {
            easy: 40,
            medium: 50,
            hard: 60
        }[difficulty];

        let removed = 0;
        while (removed < removeCount) {
            const row = Math.floor(Math.random() * 9);
            const col = Math.floor(Math.random() * 9);
            if (puzzle[row][col] !== 0) {
                puzzle[row][col] = 0;
                removed++;
            }
        }

        return {
            puzzle: puzzle,
            solution: this.board.map(row => [...row])
        };
    }
}

// 数独验证器
class SudokuValidator {
    constructor(solution) {
        this.solution = solution;
    }

    // 验证单个数字是否正确
    validateCell(row, col, num) {
        return this.solution[row][col] === num;
    }

    // 检查当前数独板是否有错误
    checkBoard(board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] !== 0) {
                    if (board[row][col] !== this.solution[row][col]) {
                        return { valid: false, row, col };
                    }
                }
            }
        }
        return { valid: true };
    }

    // 检查是否完成
    isComplete(board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    return false;
                }
            }
        }
        return true;
    }

    // 计算填充进度
    getProgress(board) {
        let filled = 0;
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] !== 0) {
                    filled++;
                }
            }
        }
        return filled;
    }
}
