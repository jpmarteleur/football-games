// Club Guesser Game Logic

let teamsData = [];
let currentTeam = null;
let currentClueIndex = 0;
let attemptsUsed = 0;
const MAX_ATTEMPTS = 6;
let gameOver = false;
let guessHistory = [];

// Clue configuration (order of reveals)
const CLUES = [
    { key: 'founded', label: 'Founded', icon: '🗓️', format: (val) => `Founded in ${val}` },
    { key: 'country', label: 'Country', icon: '🌍', format: (val) => `From ${val}` },
    { key: 'city', label: 'City', icon: '🏙️', format: (val) => `Based in ${val}` },
    { key: 'stadium', label: 'Stadium', icon: '🏟️', format: (val) => `Plays at ${val}` },
    { key: 'logo', label: 'Blurred Logo', icon: '🔲', type: 'blurred-logo' },
    { key: 'logo', label: 'Clear Logo', icon: '✅', type: 'clear-logo' }
];

// Load teams data
async function loadTeamsData() {
    try {
        showLoading();
        const response = await fetch('../assets/data/teams.json');
        if (!response.ok) {
            throw new Error('Failed to load teams data');
        }
        teamsData = await response.json();
        console.log(`✅ Loaded ${teamsData.length} teams`);
        hideLoading();
        initGame();
    } catch (error) {
        console.error('❌ Error loading teams:', error);
        showError('Failed to load teams data. Please refresh the page.');
    }
}

// Show loading state
function showLoading() {
    document.getElementById('gameContainer').innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading teams...</div>
        </div>
    `;
}

// Hide loading state
function hideLoading() {
    document.getElementById('gameContainer').innerHTML = '';
}

// Show error message
function showError(message) {
    document.getElementById('gameContainer').innerHTML = `
        <div class="loading-container">
            <div class="game-over-icon">❌</div>
            <div class="loading-text">${message}</div>
        </div>
    `;
}

// Initialize game
function initGame() {
    if (teamsData.length === 0) {
        console.error('No teams data available');
        return;
    }

    // Reset game state
    currentClueIndex = 0;
    attemptsUsed = 0;
    gameOver = false;
    guessHistory = [];

    // Select random team
    currentTeam = teamsData[Math.floor(Math.random() * teamsData.length)];
    console.log('Selected team:', currentTeam.name); // For testing

    // Reset UI
    renderGame();
    updateCluesDisplay();
    updateAttemptsDisplay();
    clearGuessHistory();
    
    // Focus input
    document.getElementById('guessInput').focus();
}

// Render main game UI
function renderGame() {
    const container = document.getElementById('gameContainer');
    container.innerHTML = `
        <div class="game-container">
            <!-- Attempts Counter -->
            <div class="attempts-container">
                <div class="attempts-text">
                    Attempts: <span class="attempts-count" id="attemptsCount">${attemptsUsed}/${MAX_ATTEMPTS}</span>
                </div>
            </div>

            <!-- Clues Container -->
            <div class="clues-container">
                <h2 class="clues-title">🔍 Clues</h2>
                <div id="cluesDisplay"></div>
            </div>

            <!-- Logo Display (hidden initially) -->
            <div class="logo-container" id="logoContainer" style="display: none;">
                <div class="logo-wrapper">
                    <img src="" alt="Team Logo" class="team-logo" id="teamLogo">
                    <div class="logo-label" id="logoLabel"></div>
                </div>
            </div>

            <!-- Input Section -->
            <div class="input-section">
                <label class="input-label" for="guessInput">
                    ⚽ Guess the team name:
                </label>
                <input 
                    type="text" 
                    id="guessInput" 
                    class="guess-input" 
                    placeholder="Enter team name..."
                    autocomplete="off"
                >
                <button class="submit-btn" id="submitBtn">
                    Submit Guess
                </button>
            </div>

            <!-- Guess History -->
            <div class="history-container" id="historyContainer" style="display: none;">
                <h3 class="history-title">📝 Previous Guesses</h3>
                <div class="guess-history" id="guessHistory"></div>
            </div>
        </div>
    `;

    // Add event listeners
    document.getElementById('submitBtn').addEventListener('click', handleGuess);
    document.getElementById('guessInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleGuess();
        }
    });
}

// Update clues display
function updateCluesDisplay() {
    const cluesDisplay = document.getElementById('cluesDisplay');
    const logoContainer = document.getElementById('logoContainer');
    
    // Clear previous clues
    cluesDisplay.innerHTML = '';
    
    // Show clues up to current index
    for (let i = 0; i <= currentClueIndex && i < CLUES.length; i++) {
        const clue = CLUES[i];
        
        if (clue.type === 'blurred-logo' || clue.type === 'clear-logo') {
            // Show logo
            logoContainer.style.display = 'block';
            const logoImg = document.getElementById('teamLogo');
            const logoLabel = document.getElementById('logoLabel');
            
            logoImg.src = currentTeam.logo;
            logoLabel.textContent = clue.label;
            
            if (clue.type === 'blurred-logo') {
                logoImg.classList.add('blurred');
                logoImg.classList.remove('clear');
            } else {
                logoImg.classList.remove('blurred');
                logoImg.classList.add('clear');
            }
        } else {
            // Show text clue
            const clueElement = document.createElement('div');
            clueElement.className = 'clue-item';
            clueElement.innerHTML = `
                <div class="clue-icon">${clue.icon}</div>
                <div class="clue-content">
                    <div class="clue-label">${clue.label}</div>
                    <div class="clue-value">${clue.format(currentTeam[clue.key])}</div>
                </div>
            `;
            cluesDisplay.appendChild(clueElement);
        }
    }
}

// Update attempts display
function updateAttemptsDisplay() {
    document.getElementById('attemptsCount').textContent = `${attemptsUsed}/${MAX_ATTEMPTS}`;
}

// Handle guess submission
function handleGuess() {
    if (gameOver) return;

    const input = document.getElementById('guessInput');
    const guess = input.value.trim();

    // Validate input
    if (!guess) {
        alert('⚽ Please enter a team name!');
        return;
    }

    // Increment attempts
    attemptsUsed++;
    updateAttemptsDisplay();

    // Add to history
    addGuessToHistory(guess);

    // Check if correct (case-insensitive)
    const isCorrect = guess.toLowerCase() === currentTeam.name.toLowerCase();

    if (isCorrect) {
        // Win!
        gameOver = true;
        setTimeout(() => showGameOver(true), 500);
    } else {
        // Wrong guess
        if (attemptsUsed >= MAX_ATTEMPTS) {
            // Lost - all attempts used
            gameOver = true;
            setTimeout(() => showGameOver(false), 500);
        } else {
            // Show next clue
            if (currentClueIndex < CLUES.length - 1) {
                currentClueIndex++;
                updateCluesDisplay();
            }
        }
    }

    // Clear input
    input.value = '';
    input.focus();
}

// Add guess to history
function addGuessToHistory(guess) {
    guessHistory.push(guess);

    const historyContainer = document.getElementById('historyContainer');
    const guessHistoryDiv = document.getElementById('guessHistory');

    // Show history container
    historyContainer.style.display = 'block';

    // Add guess item
    const guessItem = document.createElement('div');
    guessItem.className = 'guess-item';
    guessItem.innerHTML = `
        <div class="guess-number">${guessHistory.length}</div>
        <div class="guess-text">${guess}</div>
    `;
    guessHistoryDiv.appendChild(guessItem);
}

// Clear guess history
function clearGuessHistory() {
    const historyContainer = document.getElementById('historyContainer');
    const guessHistoryDiv = document.getElementById('guessHistory');
    
    historyContainer.style.display = 'none';
    guessHistoryDiv.innerHTML = '';
}

// Show game over overlay
function showGameOver(won) {
    // Disable input
    document.getElementById('guessInput').disabled = true;
    document.getElementById('submitBtn').disabled = true;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'game-over-overlay';
    overlay.innerHTML = `
        <div class="game-over-card">
            <div class="game-over-icon">${won ? '🎉' : '😔'}</div>
            <h2 class="game-over-title ${won ? 'win' : 'lose'}">
                ${won ? 'GOAL!' : 'GAME OVER'}
            </h2>
            <p class="game-over-message">
                ${won 
                    ? `Congratulations! You guessed it in <strong>${attemptsUsed}</strong> ${attemptsUsed === 1 ? 'attempt' : 'attempts'}!`
                    : `Nice try! You used all ${MAX_ATTEMPTS} attempts.`
                }
            </p>
            <div class="correct-answer">
                <div class="correct-answer-label">The team was:</div>
                <div class="correct-answer-team">
                    <img src="${currentTeam.logo}" alt="${currentTeam.name}" class="correct-answer-logo">
                    <div class="correct-answer-name">${currentTeam.name}</div>
                </div>
            </div>
            <div class="game-over-buttons">
                <button class="restart-btn" onclick="restartGame()">
                    🔄 Play Again
                </button>
                <a href="../index.html" class="home-btn">
                    🏠 Home
                </a>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Add click outside to close
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

// Restart game
function restartGame() {
    // Remove overlay
    const overlay = document.querySelector('.game-over-overlay');
    if (overlay) {
        overlay.remove();
    }

    // Restart game
    initGame();
}

// Start the game when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadTeamsData();
});
