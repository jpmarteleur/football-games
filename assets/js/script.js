
// Pool of famous soccer players
const playerPool = [
    'MESSI',
    'RONALDO',
    'NEYMAR',
    'MBAPPE',
    'HAALAND',
    'SALAH',
    'BENZEMA',
    'LEWANDOWSKI'
];

let targetPlayer = '';
let attempts = 0;
const maxAttempts = 6;
let gameOver = false;

// Initialize game
function initGame() {
    targetPlayer = playerPool[Math.floor(Math.random() * playerPool.length)];
    attempts = 0;
    gameOver = false;
    
    document.getElementById('guessesContainer').innerHTML = '';
    document.getElementById('playerGuess').value = '';
    document.getElementById('playerGuess').disabled = false;
    document.getElementById('submitGuess').disabled = false;
    document.getElementById('message').className = 'message';
    document.getElementById('message').style.display = 'none';
    document.getElementById('playAgain').classList.remove('show');
    document.getElementById('targetLength').textContent = targetPlayer.length;
    updateAttemptsDisplay();
    
    console.log('Target player:', targetPlayer); // For testing - remove in production
}

// Compare guess with target and return status for each letter
function checkGuess(guess, target) {
    guess = guess.toUpperCase();
    const result = [];
    const targetLetters = target.split('');
    const guessLetters = guess.split('');
    
    // Track which target letters have been matched
    const targetUsed = new Array(target.length).fill(false);
    const guessStatus = new Array(guess.length).fill('absent');
    
    // First pass: mark correct positions (green)
    for (let i = 0; i < guessLetters.length; i++) {
        if (guessLetters[i] === targetLetters[i]) {
            guessStatus[i] = 'correct';
            targetUsed[i] = true;
        }
    }
    
    // Second pass: mark present letters (yellow)
    for (let i = 0; i < guessLetters.length; i++) {
        if (guessStatus[i] === 'absent') {
            for (let j = 0; j < targetLetters.length; j++) {
                if (!targetUsed[j] && guessLetters[i] === targetLetters[j]) {
                    guessStatus[i] = 'present';
                    targetUsed[j] = true;
                    break;
                }
            }
        }
    }
    
    // Build result array
    for (let i = 0; i < guessLetters.length; i++) {
        result.push({
            letter: guessLetters[i],
            status: guessStatus[i]
        });
    }
    
    return result;
}

// Display guess with colored boxes
function displayGuess(guessResult) {
    const guessRow = document.createElement('div');
    guessRow.className = 'guess-row';
    
    guessResult.forEach(item => {
        const box = document.createElement('div');
        box.className = `letter-box ${item.status}`;
        box.textContent = item.letter;
        guessRow.appendChild(box);
    });
    
    document.getElementById('guessesContainer').appendChild(guessRow);
}

// Update attempts display
function updateAttemptsDisplay() {
    document.getElementById('attempts').textContent = `${attempts}/${maxAttempts}`;
}

// Handle game end
function endGame(won) {
    gameOver = true;
    document.getElementById('playerGuess').disabled = true;
    document.getElementById('submitGuess').disabled = true;
    
    const messageEl = document.getElementById('message');
    if (won) {
        messageEl.textContent = `⚽🎉 GOAL! You guessed ${targetPlayer} in ${attempts} ${attempts === 1 ? 'attempt' : 'attempts'}! 🎉⚽`;
        messageEl.className = 'message win';
    } else {
        messageEl.textContent = `😢 MISS! The player was ${targetPlayer}. Better luck next time!`;
        messageEl.className = 'message lose';
    }
    
    document.getElementById('playAgain').classList.add('show');
}

// Handle guess submission
function handleGuess() {
    if (gameOver) return;
    
    const guess = document.getElementById('playerGuess').value.trim().toUpperCase();
    
    // Validate input
    if (!guess) {
        alert('⚽ Please enter a player name!');
        return;
    }
    
    if (guess.length !== targetPlayer.length) {
        alert(`⚽ Player name must be ${targetPlayer.length} letters long!`);
        return;
    }
    
    // Check guess
    const result = checkGuess(guess, targetPlayer);
    displayGuess(result);
    attempts++;
    updateAttemptsDisplay();
    
    // Clear input
    document.getElementById('playerGuess').value = '';
    
    // Check win condition
    if (guess === targetPlayer) {
        endGame(true);
        return;
    }
    
    // Check lose condition
    if (attempts >= maxAttempts) {
        endGame(false);
        return;
    }
}

// Event listeners
document.getElementById('submitGuess').addEventListener('click', handleGuess);

document.getElementById('playerGuess').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleGuess();
    }
});

document.getElementById('playAgain').addEventListener('click', initGame);

// Start the game
initGame();
