// Pool of famous soccer players
const playerPool = [
    'MESSI',
    'RONALDO',
    'NEYMAR',
    'MBAPPE',
    'HAALAND',
    'SALAH',
    'BENZEMA',
    'LEWANDOWSKI',
    'KANE',
    'DEBRUYNE',
    'MODRIC',
    'SUAREZ',
    'VALVERDE',
    'ARAUJO',
    'UGARTE',
    'FATI',
    'PEDRI',
    'BENTANCUR',
    'VERRATTI',
    'KIMMICH',
    'GREALISH',
    'YAMAL',
    'RASHFORD',
    'NUNEZ',
    'BELLINGHAM',
    'MASTANTUONO'
];

let targetPlayer = '';
let currentRow = 0;
let currentTile = 0;
const maxAttempts = 6;
let gameOver = false;
let guesses = [];

// Statistics Management Functions
function loadStats() {
    const savedStats = localStorage.getItem('wordleStats');
    if (savedStats) {
        return JSON.parse(savedStats);
    }
    // Default stats if none exist
    return {
        gamesPlayed: 0,
        gamesWon: 0,
        currentStreak: 0,
        longestStreak: 0
    };
}

function saveStats(stats) {
    localStorage.setItem('wordleStats', JSON.stringify(stats));
}

function updateStats(won) {
    const stats = loadStats();
    
    stats.gamesPlayed++;
    
    if (won) {
        stats.gamesWon++;
        stats.currentStreak++;
        
        // Update longest streak if current is higher
        if (stats.currentStreak > stats.longestStreak) {
            stats.longestStreak = stats.currentStreak;
        }
    } else {
        // Lost the game, reset current streak
        stats.currentStreak = 0;
    }
    
    saveStats(stats);
    return stats;
}

function getWinRate(stats) {
    if (stats.gamesPlayed === 0) return 0;
    return Math.round((stats.gamesWon / stats.gamesPlayed) * 100);
}

// Initialize game
function initGame() {
    targetPlayer = playerPool[Math.floor(Math.random() * playerPool.length)];
    currentRow = 0;
    currentTile = 0;
    gameOver = false;
    guesses = Array(maxAttempts).fill('').map(() => Array(targetPlayer.length).fill(''));
    
    document.getElementById('message').className = 'message';
    document.getElementById('message').style.display = 'none';
    document.getElementById('playAgain').classList.remove('show');
    document.getElementById('targetLength').textContent = targetPlayer.length;
    updateAttemptsDisplay();
    
    createBoard();
    
    console.log('Target player:', targetPlayer); // For testing - remove in production
}

// Create the game board grid
function createBoard() {
    const board = document.getElementById('gameBoard');
    board.innerHTML = '';
    
    for (let row = 0; row < maxAttempts; row++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'board-row';
        rowDiv.id = `row-${row}`;
        
        for (let col = 0; col < targetPlayer.length; col++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.id = `tile-${row}-${col}`;
            rowDiv.appendChild(tile);
        }
        
        board.appendChild(rowDiv);
    }
}

// Update tile display
function updateBoard() {
    for (let row = 0; row < maxAttempts; row++) {
        for (let col = 0; col < targetPlayer.length; col++) {
            const tile = document.getElementById(`tile-${row}-${col}`);
            tile.textContent = guesses[row][col];
            
            // Highlight current tile
            if (row === currentRow && col === currentTile && !gameOver) {
                tile.classList.add('current');
            } else {
                tile.classList.remove('current');
            }
        }
    }
}

// Handle keyboard input
function handleKeyPress(e) {
    if (gameOver) return;
    
    const key = e.key.toUpperCase();
    
    if (key === 'ENTER') {
        submitGuess();
    } else if (key === 'BACKSPACE') {
        deleteLetter();
    } else if (key.length === 1 && key >= 'A' && key <= 'Z') {
        addLetter(key);
    }
}

// Add letter to current tile
function addLetter(letter) {
    if (currentTile < targetPlayer.length) {
        guesses[currentRow][currentTile] = letter;
        currentTile++;
        updateBoard();
    }
}

// Delete letter from current tile
function deleteLetter() {
    if (currentTile > 0) {
        currentTile--;
        guesses[currentRow][currentTile] = '';
        updateBoard();
    }
}

// Submit current guess
function submitGuess() {
    // Check if row is complete
    if (currentTile !== targetPlayer.length) {
        alert(`⚽ Please enter all ${targetPlayer.length} letters!`);
        return;
    }
    
    const guess = guesses[currentRow].join('');
    
    // Check guess and color tiles
    colorTiles(currentRow, guess);
    
    // Check win condition
    if (guess === targetPlayer) {
        gameOver = true;
        setTimeout(() => endGame(true), 500);
        return;
    }
    
    // Move to next row
    currentRow++;
    currentTile = 0;
    updateAttemptsDisplay();
    updateBoard();
    
    // Check lose condition
    if (currentRow >= maxAttempts) {
        gameOver = true;
        setTimeout(() => endGame(false), 500);
    }
}

// Color tiles based on guess
function colorTiles(row, guess) {
    const targetLetters = targetPlayer.split('');
    const guessLetters = guess.split('');
    const targetUsed = new Array(targetPlayer.length).fill(false);
    const tileStatuses = new Array(targetPlayer.length).fill('absent');
    
    // First pass: mark correct positions (green)
    for (let i = 0; i < guessLetters.length; i++) {
        if (guessLetters[i] === targetLetters[i]) {
            tileStatuses[i] = 'correct';
            targetUsed[i] = true;
        }
    }
    
    // Second pass: mark present letters (yellow)
    for (let i = 0; i < guessLetters.length; i++) {
        if (tileStatuses[i] === 'absent') {
            for (let j = 0; j < targetLetters.length; j++) {
                if (!targetUsed[j] && guessLetters[i] === targetLetters[j]) {
                    tileStatuses[i] = 'present';
                    targetUsed[j] = true;
                    break;
                }
            }
        }
    }
    
    // Apply colors with animation delay
    tileStatuses.forEach((status, i) => {
        const tile = document.getElementById(`tile-${row}-${i}`);
        setTimeout(() => {
            tile.classList.add('flip');
            setTimeout(() => {
                tile.classList.add(status);
            }, 250);
        }, i * 100);
    });
}

// Update attempts display
function updateAttemptsDisplay() {
    document.getElementById('attempts').textContent = `${currentRow}/${maxAttempts}`;
}

function endGame(won) {
    gameOver = true;
    
    // Show modal instead of inline message
    showModal(won);
    
    // Keep the old message hidden
    const messageEl = document.getElementById('message');
    messageEl.style.display = 'none';
    
    // Hide the old play again button
    document.getElementById('playAgain').classList.remove('show');
}

// Show modal popup
function showModal(won) {
    const modal = document.getElementById('gameModal');
    const icon = document.getElementById('modalIcon');
    const title = document.getElementById('modalTitle');
    const message = document.getElementById('modalMessage');
    
    // Update and get stats
    const stats = updateStats(won);
    const winRate = getWinRate(stats);
    
    // Update stats display
    updateStatsDisplay(stats, winRate, won);
    
    if (won) {
        const attemptNumber = currentRow + 1;
        icon.textContent = '⚽🎉';
        title.textContent = 'GOAL!';
        title.className = 'modal-title win';
        message.innerHTML = `You guessed <strong>${targetPlayer}</strong> in <strong>${attemptNumber}</strong> ${attemptNumber === 1 ? 'attempt' : 'attempts'}!<br><br>Amazing work! 🏆`;
    } else {
        icon.textContent = '😢⚽';
        title.textContent = 'MISS!';
        title.className = 'modal-title lose';
        message.innerHTML = `The player was <strong>${targetPlayer}</strong><br><br>Better luck next time! Keep trying! 💪`;
    }
    
    modal.classList.add('show');
}

function updateStatsDisplay(stats, winRate, won) {
    // Update the numbers
    document.getElementById('statWinRate').textContent = `${winRate}%`;
    document.getElementById('statCurrentStreak').textContent = stats.currentStreak;
    document.getElementById('statLongestStreak').textContent = stats.longestStreak;
    document.getElementById('statGamesPlayed').textContent = stats.gamesPlayed;
    document.getElementById('statGamesWon').textContent = stats.gamesWon;
    
    // Update colors based on win/lose
    const modalStats = document.getElementById('modalStats');
    const winRateValue = document.getElementById('statWinRate');
    const currentStreakValue = document.getElementById('statCurrentStreak');
    const longestStreakValue = document.getElementById('statLongestStreak');
    
    // Reset classes
    modalStats.classList.remove('lose-bg');
    winRateValue.classList.remove('lose-color');
    currentStreakValue.className = 'stat-value current-streak';
    longestStreakValue.className = 'stat-value longest-streak';
    
    if (!won) {
        modalStats.classList.add('lose-bg');
        winRateValue.classList.add('lose-color');
    }
}

// Close modal and restart game
function closeModal() {
    const modal = document.getElementById('gameModal');
    modal.classList.remove('show');
    initGame();
}
// Close modal without restarting game
function closeModalOnly() {
    const modal = document.getElementById('gameModal');
    modal.classList.remove('show');
}

// Event listeners
document.addEventListener('keydown', handleKeyPress);
document.getElementById('playAgain').addEventListener('click', initGame);
document.getElementById('modalButton').addEventListener('click', closeModal);
document.getElementById('modalClose').addEventListener('click', closeModalOnly);

// Start the game
initGame();