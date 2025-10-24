// Use shared stats functions
const STATS_KEY = 'wordleStats';
const DIFFICULTY_KEY = 'wordleDifficulty';

// Difficulty settings
const DIFFICULTY_SETTINGS = {
    easy: {
        nameLength: { min: 8, max: 12 },
        showNationality: true,
        showPosition: true,
        label: 'EASY',
        emoji: '🟢'
    },
    medium: {
        nameLength: { min: 5, max: 10 },
        showNationality: true,
        showPosition: false,
        label: 'MEDIUM',
        emoji: '🟡'
    },
    hard: {
        nameLength: { min: 4, max: 7 },
        showNationality: false,
        showPosition: false,
        label: 'HARD',
        emoji: '🔴'
    }
};

let currentDifficulty = null;

// Pool of famous soccer players
let playerPool = [];
let fullPlayerData = []; // Store full player objects
let isLoadingPlayers = true;

// Load players from API (with fallback to JSON)
async function loadPlayers() {
    try {
        console.log('🔄 Loading players...');
        
        // Get full player data from API/cache
        const data = await PlayerDataManager.getPlayersWithFallback();
        
        // Extract just the last names for the Wordle game
        if (Array.isArray(data) && data.length > 0) {
            // Check if it's already just names (old format) or full objects (new format)
            if (typeof data[0] === 'string') {
                // Old format - just names
                playerPool = data;
                fullPlayerData = []; // No full data available
            } else {
                // New format - full player objects
                fullPlayerData = data; // Store full data
                playerPool = PlayerDataManager.getPlayerNames(data);
            }
        }
        
        console.log(`✅ Loaded ${playerPool.length} players`);
        isLoadingPlayers = false;
        
        // Start the game once players are loaded
        initGame();
        
    } catch (error) {
        console.error('❌ Error loading players:', error);
        
        // Emergency fallback
        playerPool = ['MESSI', 'RONALDO', 'NEYMAR', 'HAALAND', 'MBAPPE'];
        console.log('📄 Using emergency fallback names');
        
        isLoadingPlayers = false;
        initGame();
    }
}

// Start loading players immediately
loadPlayers();

// Difficulty Management Functions
function saveDifficulty(difficulty) {
    localStorage.setItem(DIFFICULTY_KEY, difficulty);
}

function loadSavedDifficulty() {
    return localStorage.getItem(DIFFICULTY_KEY) || null;
}

function filterPlayersByDifficulty(allPlayers, difficulty) {
    const settings = DIFFICULTY_SETTINGS[difficulty];
    
    return allPlayers.filter(player => {
        const nameLength = player.lastName.length;
        return nameLength >= settings.nameLength.min && nameLength <= settings.nameLength.max;
    });
}

function showDifficultySelector() {
    document.getElementById('difficultySelector').style.display = 'block';
    document.getElementById('gameInfo').style.display = 'none';
    document.getElementById('gameBoard').style.display = 'none';
    document.getElementById('keyboardInfo').style.display = 'none';
    document.getElementById('changeDifficulty').style.display = 'none';
}

function hideDifficultySelector() {
    document.getElementById('difficultySelector').style.display = 'none';
    document.getElementById('gameInfo').style.display = 'block';
    document.getElementById('gameBoard').style.display = 'flex';
    document.getElementById('keyboardInfo').style.display = 'block';
    document.getElementById('changeDifficulty').style.display = 'block';
}

function updateDifficultyIndicator() {
    const settings = DIFFICULTY_SETTINGS[currentDifficulty];
    const indicator = document.getElementById('difficultyIndicator');
    indicator.textContent = `${settings.emoji} ${settings.label}`;
    indicator.className = `difficulty-indicator ${currentDifficulty}`;
}

function updateGameHints() {
    const settings = DIFFICULTY_SETTINGS[currentDifficulty];
    const hintsContainer = document.getElementById('gameHints');
    
    if (!settings.showNationality && !settings.showPosition) {
        hintsContainer.style.display = 'none';
        return;
    }
    
    hintsContainer.style.display = 'block';
    let hintsHTML = '';
    
    if (targetPlayerData) {
        if (settings.showNationality) {
            hintsHTML += `<p><span class="hint-label">Nationality:</span> ${targetPlayerData.nationality}</p>`;
        }
        if (settings.showPosition) {
            hintsHTML += `<p><span class="hint-label">Position:</span> ${targetPlayerData.position}</p>`;
        }
    }
    
    hintsContainer.innerHTML = hintsHTML;
}

function selectDifficulty(difficulty) {
    currentDifficulty = difficulty;
    saveDifficulty(difficulty);
    
    // Add visual feedback with delay for animation
    const selectedCard = document.querySelector(`.difficulty-card[data-difficulty="${difficulty}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selecting');
        setTimeout(() => {
            hideDifficultySelector();
            initGame();
        }, 600);
    } else {
        hideDifficultySelector();
        initGame();
    }
}

let targetPlayer = '';
let targetPlayerData = null; // Store full player object for current game
let currentRow = 0;
let currentTile = 0;
const maxAttempts = 6;
let gameOver = false;
let guesses = [];

// Initialize game
function initGame() {
    // Check if difficulty is selected
    if (!currentDifficulty) {
        showDifficultySelector();
        return;
    }
    
    // Wait for players to load
    if (isLoadingPlayers || playerPool.length === 0) {
        console.log('⏳ Waiting for players to load...');
        setTimeout(initGame, 100);
        return;
    }
    
    // Filter players by difficulty
    const filteredPlayers = filterPlayersByDifficulty(fullPlayerData, currentDifficulty);
    
    if (filteredPlayers.length === 0) {
        console.error('❌ No players match the difficulty criteria!');
        alert('No players available for this difficulty. Please try another difficulty.');
        currentDifficulty = null;
        showDifficultySelector();
        return;
    }
    
    // Pick a random player from filtered list
    const randomIndex = Math.floor(Math.random() * filteredPlayers.length);
    targetPlayerData = filteredPlayers[randomIndex];
    targetPlayer = targetPlayerData.lastName;
    
    console.log(`Selected player: ${targetPlayer} (${currentDifficulty} mode)`);
    
    currentRow = 0;
    currentTile = 0;
    gameOver = false;
    guesses = Array(maxAttempts).fill('').map(() => Array(targetPlayer.length).fill(''));
    
    document.getElementById('message').className = 'message';
    document.getElementById('message').style.display = 'none';
    document.getElementById('playAgain').classList.remove('show');
    
    // Removed targetLength display - no longer needed
    updateDifficultyIndicator();
    updateGameHints();
    
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

// Update attempts display - REMOVED (no longer showing attempts in UI)
// function updateAttemptsDisplay() {
//     document.getElementById('attempts').textContent = `${currentRow}/${maxAttempts}`;
// }

function endGame(won) {
    gameOver = true;
    
    // Show modal instead of inline message
    showModal(won, currentDifficulty);
    
    // Keep the old message hidden
    const messageEl = document.getElementById('message');
    messageEl.style.display = 'none';
    
    // Hide the old play again button
    document.getElementById('playAgain').classList.remove('show');
}

// Show modal popup
function showModal(won, difficulty) {
    const modal = document.getElementById('gameModal');
    const icon = document.getElementById('modalIcon');
    const title = document.getElementById('modalTitle');
    const message = document.getElementById('modalMessage');
    
    // Update and get stats for current difficulty
    const statsKey = `${STATS_KEY}_${difficulty}`;
    const stats = updateStats(statsKey, won);
    const winRate = getWinRate(stats);
    
    // Update stats display
    updateStatsDisplay(stats, winRate, won);
    
    // Build player info HTML
    let playerInfoHTML = '';
    if (targetPlayerData) {
        playerInfoHTML = `
            <div style="margin: 15px 0;">
                <img src="${targetPlayerData.photo}" 
                     alt="${targetPlayerData.lastName}" 
                     style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid #ffd700;"
                     onerror="this.style.display='none'">
                <div style="font-size: 1.2em; font-weight: bold; color: #1a472a; margin-top: 10px;">
                    ${targetPlayerData.lastName}
                </div>
            </div>
        `;
    }
    
    const difficultySettings = DIFFICULTY_SETTINGS[difficulty];
    const difficultyBadge = `<span style="background: ${difficulty === 'easy' ? '#4ade80' : difficulty === 'medium' ? '#fbbf24' : '#ef4444'}; padding: 4px 12px; border-radius: 15px; font-size: 0.85em; font-weight: 700;">${difficultySettings.emoji} ${difficultySettings.label}</span>`;
    
    if (won) {
        const attemptNumber = currentRow + 1;
        title.textContent = 'GOAL!';
        title.className = 'modal-title win';
        message.innerHTML = `
            You guessed in <strong>${attemptNumber}</strong> ${attemptNumber === 1 ? 'attempt' : 'attempts'}!
            <div style="margin-top: 10px;">${difficultyBadge}</div>
            ${playerInfoHTML}
            <div style="margin-top: 10px;">Amazing work! 🏆</div>
        `;
    } else {
        title.textContent = 'MISS!';
        title.className = 'modal-title lose';
        message.innerHTML = `
            The player was:
            <div style="margin-top: 10px;">${difficultyBadge}</div>
            ${playerInfoHTML}
            <div style="margin-top: 10px;">Better luck next time! 💪</div>
        `;
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

// Event listeners - Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    // Keyboard listener
    document.addEventListener('keydown', handleKeyPress);
    
    // Game control buttons
    document.getElementById('playAgain').addEventListener('click', initGame);
    document.getElementById('modalButton').addEventListener('click', closeModal);
    document.getElementById('modalClose').addEventListener('click', closeModalOnly);

    // Difficulty selection event listeners
    document.querySelectorAll('.difficulty-card').forEach(card => {
        card.addEventListener('click', function() {
            const difficulty = this.getAttribute('data-difficulty');
            selectDifficulty(difficulty);
        });
    });

    // Change difficulty button
    document.getElementById('changeDifficulty').addEventListener('click', function() {
        currentDifficulty = null;
        showDifficultySelector();
    });

    // Check for saved difficulty preference on load
    const savedDifficulty = loadSavedDifficulty();
    if (savedDifficulty) {
        currentDifficulty = savedDifficulty;
    }
});

// Players will load automatically via loadPlayers() call above