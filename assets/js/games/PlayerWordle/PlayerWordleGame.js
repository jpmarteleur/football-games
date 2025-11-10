// Player Wordle Game - Main game class
class PlayerWordleGame {
    constructor(options = {}) {
        // Game state
        this.targetPlayer = '';
        this.targetPlayerData = null;
        this.displayPlayerData = null; // Snapshot for modal display
        this.currentRow = 0;
        this.currentTile = 0;
        this.maxAttempts = 6;
        this.gameOver = false;
        this.guesses = [];
        this.players = [];
        this.isLoadingPlayers = true;

        // UI elements
        this.difficultySelector = document.getElementById('difficultySelector');
        this.gameInfo = document.getElementById('gameInfo');
        this.gameBoard = document.getElementById('gameBoard');
        this.keyboardInfo = document.getElementById('keyboardInfo');
        this.gameButtons = document.getElementById('gameButtons');
        this.difficultyIndicator = document.getElementById('difficultyIndicator');
        this.gameHints = document.getElementById('gameHints');
        this.message = document.getElementById('message');
        this.modal = document.getElementById('gameModal');

        // Managers
        this.difficultyManager = new DifficultyManager();
        this.boardRenderer = new BoardRenderer('gameBoard');
        this.statsManager = null; // Will be initialized when difficulty is set
        this.mobileInputHandler = new MobileInputHandler({
            onLetter: (letter) => this.addLetter(letter),
            onEnter: () => this.submitGuess(),
            onBackspace: () => this.deleteLetter(),
            onFocus: () => this.focusMobileInput()
        });

        // Initialize
        this.init();
    }

    // Initialize the game
    async init() {
        try {
            // Ensure board is hidden initially
            this.boardRenderer.hide();

            // Load players
            await this.loadPlayers();

            // Load saved difficulty
            const savedDifficulty = this.difficultyManager.loadDifficulty();
            if (savedDifficulty) {
                this.difficultyManager.setDifficulty(savedDifficulty);
                this.updateStatsManager(savedDifficulty);
            }

            // Check if difficulty is selected
            if (!this.difficultyManager.getCurrentDifficulty()) {
                this.showDifficultySelector();
            } else {
                this.startGame();
            }

            // Setup event listeners
            this.setupEventListeners();

            // Initialize mobile input if needed
            this.setupMobileInput();
        } catch (error) {
            console.error('Error initializing game:', error);
            this.showError('Failed to initialize game. Please refresh the page.');
        }
    }

    // Load players from data service
    async loadPlayers() {
        try {
            this.isLoadingPlayers = true;
            await dataService.loadPlayers();
            this.players = dataService.players;
            this.isLoadingPlayers = false;
            console.log(`✅ Loaded ${this.players.length} players`);
        } catch (error) {
            console.error('❌ Error loading players:', error);
            this.isLoadingPlayers = false;
            throw error;
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Keyboard listener
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // Difficulty selection
        document.querySelectorAll('.difficulty-card').forEach(card => {
            card.addEventListener('click', () => {
                const difficulty = card.getAttribute('data-difficulty');
                this.selectDifficulty(difficulty);
            });
        });

        // Change difficulty button
        const changeDifficultyBtn = document.getElementById('changeDifficulty');
        if (changeDifficultyBtn) {
            changeDifficultyBtn.addEventListener('click', () => {
                this.difficultyManager.setDifficulty(null);
                this.showDifficultySelector();
            });
        }

        // Play again button
        const playAgainBtn = document.getElementById('playAgain');
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => this.startGame());
        }

        // Modal buttons
        const modalButton = document.getElementById('modalButton');
        if (modalButton) {
            modalButton.addEventListener('click', () => this.closeModal());
        }

        const modalClose = document.getElementById('modalClose');
        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeModalOnly());
        }

        // Window resize for board sizing
        window.addEventListener('resize', () => this.boardRenderer.sizeTiles());
    }

    // Setup mobile input
    setupMobileInput() {
        this.mobileInputHandler.init('mobileTextInput', 'gameBoard');
    }

    // Show difficulty selector
    showDifficultySelector() {
        if (this.difficultySelector) this.difficultySelector.style.display = 'block';
        if (this.gameInfo) this.gameInfo.style.display = 'none';
        if (this.keyboardInfo) this.keyboardInfo.style.display = 'none';
        if (this.gameButtons) this.gameButtons.style.display = 'none';
        
        // Hide and clear the game board using BoardRenderer
        this.boardRenderer.hide();

        // Remove 'selecting' class from all difficulty cards
        document.querySelectorAll('.difficulty-card').forEach(card => {
            card.classList.remove('selecting');
        });
    }

    // Hide difficulty selector
    hideDifficultySelector() {
        if (this.difficultySelector) this.difficultySelector.style.display = 'none';
        if (this.gameInfo) this.gameInfo.style.display = 'block';
        if (this.gameBoard) this.gameBoard.style.display = 'flex';
        if (this.keyboardInfo) this.keyboardInfo.style.display = 'block';
        if (this.gameButtons) this.gameButtons.style.display = 'flex';
    }

    // Select difficulty
    selectDifficulty(difficulty) {
        if (!this.difficultyManager.setDifficulty(difficulty)) {
            console.error('Invalid difficulty:', difficulty);
            return;
        }

        // Initialize or update stats manager with new difficulty
        this.updateStatsManager(difficulty);

        // Visual feedback
        const selectedCard = document.querySelector(`.difficulty-card[data-difficulty="${difficulty}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selecting');
            setTimeout(() => {
                this.hideDifficultySelector();
                this.startGame();
            }, 120);
        } else {
            this.hideDifficultySelector();
            this.startGame();
        }
    }

    // Start a new game
    startGame() {
        // Wait for players to load
        if (this.isLoadingPlayers || this.players.length === 0) {
            console.log('⏳ Waiting for players to load...');
            setTimeout(() => this.startGame(), 100);
            return;
        }

        const difficulty = this.difficultyManager.getCurrentDifficulty();
        if (!difficulty) {
            this.showDifficultySelector();
            // Ensure board is hidden and cleared
            this.boardRenderer.hide();
            return;
        }

        // Get random player for difficulty
        const filteredPlayers = this.difficultyManager.filterPlayers(this.players, difficulty);
        if (filteredPlayers.length === 0) {
            console.error('❌ No players match the difficulty criteria!');
            alert('No players available for this difficulty. Please try another difficulty.');
            this.difficultyManager.setDifficulty(null);
            this.showDifficultySelector();
            return;
        }

        // Select random player
        const randomIndex = Math.floor(Math.random() * filteredPlayers.length);
        this.targetPlayerData = filteredPlayers[randomIndex];
        this.targetPlayer = this.targetPlayerData.lastName;

        // Store snapshot for modal
        this.displayPlayerData = { ...this.targetPlayerData };

        console.log(`Selected player: ${this.targetPlayer} (${difficulty} mode)`);

        // Reset game state
        this.currentRow = 0;
        this.currentTile = 0;
        this.gameOver = false;
        this.guesses = Array(this.maxAttempts).fill('').map(() => Array(this.targetPlayer.length).fill(''));

        // Reset UI
        if (this.message) {
            this.message.className = 'message';
            this.message.style.display = 'none';
        }

        const playAgainBtn = document.getElementById('playAgain');
        if (playAgainBtn) {
            playAgainBtn.classList.remove('show');
        }

        // Update UI
        this.updateDifficultyIndicator();
        this.updateGameHints();

        // Create board
        this.boardRenderer.createBoard(this.targetPlayer.length, this.maxAttempts);
        this.boardRenderer.show();

        // Remove focus from buttons
        if (document.activeElement && document.activeElement.tagName === 'BUTTON') {
            document.activeElement.blur();
        }

        // Focus mobile input if enabled
        if (this.mobileInputHandler.isEnabled()) {
            setTimeout(() => this.mobileInputHandler.focus(), 100);
        }
    }

    // Update difficulty indicator
    updateDifficultyIndicator() {
        const difficulty = this.difficultyManager.getCurrentDifficulty();
        if (!difficulty || !this.difficultyIndicator) return;

        const settings = this.difficultyManager.getSettings(difficulty);
        this.difficultyIndicator.textContent = settings.label;
        this.difficultyIndicator.className = `difficulty-indicator ${difficulty}`;
    }

    // Update game hints
    updateGameHints() {
        const difficulty = this.difficultyManager.getCurrentDifficulty();
        if (!difficulty || !this.gameHints) return;

        const settings = this.difficultyManager.getSettings(difficulty);
        
        if (!settings.showNationality && !settings.showPosition) {
            this.gameHints.style.display = 'none';
            return;
        }

        this.gameHints.style.display = 'block';
        let hintsHTML = '';

        if (this.targetPlayerData) {
            if (settings.showNationality) {
                hintsHTML += `<p><span class="hint-label">Nationality:</span> ${this.targetPlayerData.nationality}</p>`;
            }
            if (settings.showPosition) {
                hintsHTML += `<p><span class="hint-label">Position:</span> ${this.targetPlayerData.position}</p>`;
            }
        }

        this.gameHints.innerHTML = hintsHTML;
    }

    // Handle key press
    handleKeyPress(e) {
        if (this.gameOver) return;

        // Don't handle if mobile input is active
        if (this.mobileInputHandler.isEnabled() && 
            document.activeElement === this.mobileInputHandler.inputElement) {
            return;
        }

        const keyRaw = e.key || '';
        const key = keyRaw.toUpperCase();

        if (key === 'ENTER') {
            this.submitGuess();
        } else if (key === 'BACKSPACE') {
            this.deleteLetter();
        } else if (key.length === 1 && key >= 'A' && key <= 'Z') {
            this.addLetter(key);
        }
    }

    // Add letter to current tile
    addLetter(letter) {
        if (this.currentTile < this.targetPlayer.length) {
            this.guesses[this.currentRow][this.currentTile] = letter;
            this.currentTile++;
            this.boardRenderer.updateBoard(this.guesses, this.currentRow, this.currentTile, this.gameOver);
        }
    }

    // Delete letter from current tile
    deleteLetter() {
        if (this.currentTile > 0) {
            this.currentTile--;
            this.guesses[this.currentRow][this.currentTile] = '';
            this.boardRenderer.updateBoard(this.guesses, this.currentRow, this.currentTile, this.gameOver);
        }
    }

    // Submit current guess
    submitGuess() {
        // Check if row is complete
        if (this.currentTile !== this.targetPlayer.length) {
            alert(`Please enter all ${this.targetPlayer.length} letters!`);
            return;
        }

        const guess = this.guesses[this.currentRow].join('');

        // Color tiles
        this.boardRenderer.colorTiles(this.currentRow, guess, this.targetPlayer);

        // Check win condition
        if (guess === this.targetPlayer) {
            this.gameOver = true;
            setTimeout(() => this.endGame(true), 500);
            return;
        }

        // Move to next row
        this.currentRow++;
        this.currentTile = 0;
        this.boardRenderer.updateBoard(this.guesses, this.currentRow, this.currentTile, this.gameOver);

        // Check lose condition
        if (this.currentRow >= this.maxAttempts) {
            this.gameOver = true;
            setTimeout(() => this.endGame(false), 500);
        }
    }

    // Update stats manager for current difficulty
    updateStatsManager(difficulty) {
        if (!difficulty) return;
        this.statsManager = new StatsManager('wordleStats_' + difficulty);
    }

    // End game
    endGame(won) {
        this.gameOver = true;

        // Ensure stats manager is initialized
        const difficulty = this.difficultyManager.getCurrentDifficulty();
        this.updateStatsManager(difficulty);
        
        if (!this.statsManager) {
            console.error('Stats manager not initialized');
            return;
        }

        // Update stats
        const stats = this.statsManager.update(won);

        // Show modal
        this.showModal(won, stats);

        // Hide message and play again button
        if (this.message) {
            this.message.style.display = 'none';
        }

        const playAgainBtn = document.getElementById('playAgain');
        if (playAgainBtn) {
            playAgainBtn.classList.remove('show');
        }
    }

    // Show modal
    showModal(won, stats) {
        if (!this.modal) return;

        const icon = document.getElementById('modalIcon');
        const title = document.getElementById('modalTitle');
        const message = document.getElementById('modalMessage');

        const winRate = this.statsManager.getWinRate(stats);

        // Update stats display
        this.updateStatsDisplay(stats, winRate, won);

        // Player info
        let playerInfoHTML = '';
        if (this.displayPlayerData) {
            playerInfoHTML = `
                <div style="margin: 15px 0;">
                    <img src="${this.displayPlayerData.photo}" 
                         alt="${this.displayPlayerData.lastName}" 
                         style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid #ffd700;"
                         onerror="this.style.display='none'">
                    <div style="font-size: 1.2em; font-weight: bold; color: #1a472a; margin-top: 10px;">
                        ${this.displayPlayerData.lastName}
                    </div>
                </div>
            `;
        }

        if (won) {
            const attemptNumber = this.currentRow + 1;
            if (title) {
                title.textContent = 'GOAL!';
                title.className = 'modal-title win';
            }
            if (message) {
                message.innerHTML = `
                    You guessed in <strong>${attemptNumber}</strong> ${attemptNumber === 1 ? 'attempt' : 'attempts'}!
                    ${playerInfoHTML}
                    <div style="margin-top: 10px;">Amazing work! 🏆</div>
                `;
            }
        } else {
            if (title) {
                title.textContent = 'MISS!';
                title.className = 'modal-title lose';
            }
            if (message) {
                message.innerHTML = `
                    The player was:
                    ${playerInfoHTML}
                    <div style="margin-top: 10px;">Better luck next time! 💪</div>
                `;
            }
        }

        this.modal.classList.add('show');

        // Hide mobile keyboard
        if (this.mobileInputHandler.isEnabled()) {
            this.mobileInputHandler.blur();
        }
    }

    // Update stats display
    updateStatsDisplay(stats, winRate, won) {
        const statWinRate = document.getElementById('statWinRate');
        const statCurrentStreak = document.getElementById('statCurrentStreak');
        const statLongestStreak = document.getElementById('statLongestStreak');
        const statGamesPlayed = document.getElementById('statGamesPlayed');
        const statGamesWon = document.getElementById('statGamesWon');
        const modalStats = document.getElementById('modalStats');

        if (statWinRate) statWinRate.textContent = `${winRate}%`;
        if (statCurrentStreak) statCurrentStreak.textContent = stats.currentStreak;
        if (statLongestStreak) statLongestStreak.textContent = stats.longestStreak;
        if (statGamesPlayed) statGamesPlayed.textContent = stats.gamesPlayed;
        if (statGamesWon) statGamesWon.textContent = stats.gamesWon;

        // Update colors based on win/lose
        if (modalStats) {
            modalStats.classList.remove('lose-bg');
            if (statWinRate) statWinRate.classList.remove('lose-color');
            if (statCurrentStreak) statCurrentStreak.className = 'stat-value current-streak';
            if (statLongestStreak) statLongestStreak.className = 'stat-value longest-streak';

            if (!won) {
                modalStats.classList.add('lose-bg');
                if (statWinRate) statWinRate.classList.add('lose-color');
            }
        }
    }

    // Close modal and restart game
    closeModal() {
        if (this.modal) {
            this.modal.classList.remove('show');
        }
        this.startGame();
    }

    // Close modal without restarting
    closeModalOnly() {
        if (this.modal) {
            this.modal.classList.remove('show');
        }
        // Refocus mobile input
        if (this.mobileInputHandler.isEnabled()) {
            this.mobileInputHandler.focus();
        }
    }

    // Focus mobile input
    focusMobileInput() {
        if (this.mobileInputHandler.isEnabled() && !this.gameOver) {
            this.mobileInputHandler.focus();
        }
    }

    // Show error message
    showError(message) {
        if (this.message) {
            this.message.textContent = message;
            this.message.className = 'message error';
            this.message.style.display = 'block';
        }
    }
}

