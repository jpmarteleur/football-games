// Club Guesser Game - Refactored with shared services
class ClubGuesserGame {
    constructor() {
        this.teamsData = [];
        this.currentTeam = null;
        this.currentClueIndex = 0;
        this.attemptsUsed = 0;
        this.MAX_ATTEMPTS = 6;
        this.gameOver = false;
        this.guessHistory = [];
        this.DEBUG = false;

        // Clue configuration (order of reveals)
        this.CLUES = [
            { key: 'founded', label: 'Founded', icon: '🗓️', format: (val) => `Founded in ${val}` },
            { key: 'country', label: 'Country', icon: '🌍', format: (val) => `From ${val}` },
            { key: 'city', label: 'City', icon: '🏙️', format: (val) => `Based in ${val}` },
            { key: 'stadium', label: 'Stadium', icon: '🏟️', format: (val) => `Plays at ${val}` },
            { key: 'logo', label: 'Blurred Logo', icon: '🔲', type: 'blurred-logo' },
            { key: 'logo', label: 'Clear Logo', icon: '✅', type: 'clear-logo' }
        ];

        this.init();
    }

    async init() {
        try {
            await this.loadTeamsData();
            this.initGame();
        } catch (error) {
            console.error('Error initializing game:', error);
            this.showError('Failed to load game data. Please refresh the page.');
        }
    }

    // Load teams data using DataService
    async loadTeamsData() {
        try {
            this.showLoading();
            // Use shared DataService
            dataService.setBasePath('../assets/data');
            await dataService.loadTeams();
            
            this.teamsData = dataService.teams;

            // Validate data
            if (!Array.isArray(this.teamsData) || this.teamsData.length === 0) {
                throw new Error('Invalid teams data format');
            }

            // Validate each team has required fields
            const validTeams = this.teamsData.filter(team => 
                team.name && 
                team.founded && 
                team.country && 
                team.city && 
                team.stadium && 
                team.logo
            );

            if (validTeams.length === 0) {
                throw new Error('No valid teams found in data');
            }

            this.teamsData = validTeams;
            if (this.DEBUG) {
                console.log(`✅ Loaded ${this.teamsData.length} teams`);
            }
            this.hideLoading();
        } catch (error) {
            console.error('❌ Error loading teams:', error);
            this.hideLoading();
            throw error;
        }
    }

    // Show loading state
    showLoading() {
        const container = this.getGameContainer();
        if (!container) return;
        
        container.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <div class="loading-text">Loading teams...</div>
            </div>
        `;
    }

    // Hide loading state
    hideLoading() {
        const container = this.getGameContainer();
        if (container) {
            container.innerHTML = '';
        }
    }

    // Show error message
    showError(message) {
        const container = this.getGameContainer();
        if (!container) return;

        container.innerHTML = `
            <div class="loading-container">
                <div class="game-over-icon">❌</div>
                <div class="loading-text">${this.escapeHtml(message)}</div>
                <button class="restart-btn" onclick="location.reload()" style="margin-top: 20px;">
                    🔄 Refresh Page
                </button>
            </div>
        `;
    }

    // Show validation error message (non-blocking)
    showValidationError(message) {
        const input = document.getElementById('guessInput');
        if (!input) return;

        // Create or update error message element
        let errorMsg = document.getElementById('validationError');
        if (!errorMsg) {
            errorMsg = document.createElement('div');
            errorMsg.id = 'validationError';
            errorMsg.className = 'validation-error';
            errorMsg.setAttribute('role', 'alert');
            input.parentNode.insertBefore(errorMsg, input);
        }
        
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
        
        // Remove error after 3 seconds
        setTimeout(() => {
            if (errorMsg) {
                errorMsg.style.display = 'none';
            }
        }, 3000);
    }

    // Get game container with error handling
    getGameContainer() {
        const container = document.getElementById('gameContainer');
        if (!container) {
            console.error('Game container not found');
        }
        return container;
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Normalize team name for comparison (handles common variations)
    normalizeTeamName(name) {
        if (!name) return '';
        
        return name
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/[^\w\s]/g, '') // Remove special characters
            .replace(/\b(fc|cf|cfc|united|utd|city|town|rovers|athletic|ath|albion)\b/gi, ''); // Remove common suffixes
    }

    // Check if guess matches team name (fuzzy matching)
    isGuessCorrect(guess, teamName) {
        const normalizedGuess = this.normalizeTeamName(guess);
        const normalizedTeam = this.normalizeTeamName(teamName);
        
        // Exact match (case-insensitive)
        if (guess.toLowerCase().trim() === teamName.toLowerCase().trim()) {
            return true;
        }
        
        // Normalized match
        if (normalizedGuess === normalizedTeam) {
            return true;
        }
        
        // Check if normalized guess contains team name or vice versa
        if (normalizedGuess.includes(normalizedTeam) || normalizedTeam.includes(normalizedGuess)) {
            return true;
        }
        
        return false;
    }

    // Initialize game
    initGame() {
        if (this.teamsData.length === 0) {
            console.error('No teams data available');
            this.showError('No teams data available. Please refresh the page.');
            return;
        }

        // Reset game state
        this.currentClueIndex = 0;
        this.attemptsUsed = 0;
        this.gameOver = false;
        this.guessHistory = [];

        // Select random team from validated teams
        const randomIndex = Math.floor(Math.random() * this.teamsData.length);
        this.currentTeam = this.teamsData[randomIndex];
        
        if (this.DEBUG) {
            console.log('Selected team:', this.currentTeam.name);
        }

        // Validate team data
        if (!this.currentTeam || !this.currentTeam.name) {
            console.error('Invalid team selected');
            this.showError('Error selecting team. Please refresh the page.');
            return;
        }

        // Reset UI
        this.renderGame();
        this.updateCluesDisplay();
        this.updateAttemptsDisplay();
        
        // Focus input after a short delay to ensure DOM is ready
        setTimeout(() => {
            const input = document.getElementById('guessInput');
            if (input) {
                input.focus();
            }
        }, 100);
    }

    // Render main game UI
    renderGame() {
        const container = this.getGameContainer();
        if (!container) return;

        container.innerHTML = `
            <div class="game-container">
                <!-- Attempts Counter -->
                <div class="attempts-container">
                    <div class="attempts-text">
                        Attempts: <span class="attempts-count" id="attemptsCount">${this.attemptsUsed}/${this.MAX_ATTEMPTS}</span>
                    </div>
                </div>

                <!-- Clues Container -->
                <div class="clues-container">
                    <h2 class="clues-title">🔍 Clues</h2>
                    <div id="cluesDisplay" role="list" aria-label="Game clues"></div>
                </div>

                <!-- Logo Display (hidden initially) -->
                <div class="logo-container" id="logoContainer" style="display: none;" role="img" aria-label="Team logo">
                    <div class="logo-wrapper">
                        <img src="" alt="Team Logo" class="team-logo" id="teamLogo" loading="lazy">
                        <div class="logo-label" id="logoLabel"></div>
                    </div>
                </div>

                <!-- Input Section -->
                <div class="input-section">
                    <label class="input-label" for="guessInput">
                        <img src="../assets/images/soccer-ball.svg" alt="Soccer Ball" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 5px;"> Guess the team name:
                    </label>
                    <input 
                        type="text" 
                        id="guessInput" 
                        class="guess-input" 
                        placeholder="Enter team name..."
                        autocomplete="off"
                        aria-label="Team name guess input"
                        aria-describedby="validationError"
                    >
                    <button class="submit-btn" id="submitBtn" aria-label="Submit your guess">
                        Submit Guess
                    </button>
                </div>
            </div>
        `;

        // Add event listeners with error handling
        const submitBtn = document.getElementById('submitBtn');
        const guessInput = document.getElementById('guessInput');
        
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.handleGuess());
        }
        
        if (guessInput) {
            guessInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleGuess();
                }
            });
        }
    }

    // Update clues display
    updateCluesDisplay() {
        const cluesDisplay = document.getElementById('cluesDisplay');
        const logoContainer = document.getElementById('logoContainer');
        
        if (!cluesDisplay || !this.currentTeam) return;
        
        // Clear previous clues
        cluesDisplay.innerHTML = '';
        
        // Show clues up to current index
        for (let i = 0; i <= this.currentClueIndex && i < this.CLUES.length; i++) {
            const clue = this.CLUES[i];
            
            if (clue.type === 'blurred-logo' || clue.type === 'clear-logo') {
                // Show logo
                if (logoContainer) {
                    logoContainer.style.display = 'block';
                    const logoImg = document.getElementById('teamLogo');
                    const logoLabel = document.getElementById('logoLabel');
                    
                    if (logoImg && logoLabel) {
                        // Handle image loading errors
                        logoImg.onerror = () => {
                            logoImg.alt = 'Logo not available';
                            if (this.DEBUG) {
                                console.warn('Failed to load logo:', this.currentTeam.logo);
                            }
                        };
                        
                        logoImg.src = this.currentTeam.logo;
                        logoLabel.textContent = clue.label;
                        
                        if (clue.type === 'blurred-logo') {
                            logoImg.classList.add('blurred');
                            logoImg.classList.remove('clear');
                        } else {
                            logoImg.classList.remove('blurred');
                            logoImg.classList.add('clear');
                        }
                    }
                }
            } else {
                // Show text clue
                const clueElement = document.createElement('div');
                clueElement.className = 'clue-item';
                clueElement.setAttribute('role', 'listitem');
                clueElement.innerHTML = `
                    <div class="clue-icon" aria-hidden="true">${clue.icon}</div>
                    <div class="clue-content">
                        <div class="clue-label">${this.escapeHtml(clue.label)}</div>
                        <div class="clue-value">${this.escapeHtml(clue.format(this.currentTeam[clue.key]))}</div>
                    </div>
                `;
                cluesDisplay.appendChild(clueElement);
            }
        }
    }

    // Update attempts display
    updateAttemptsDisplay() {
        const attemptsCount = document.getElementById('attemptsCount');
        if (attemptsCount) {
            attemptsCount.textContent = `${this.attemptsUsed}/${this.MAX_ATTEMPTS}`;
        }
    }

    // Handle guess submission
    handleGuess() {
        if (this.gameOver) return;

        const input = document.getElementById('guessInput');
        if (!input) {
            console.error('Input element not found');
            return;
        }

        const guess = input.value.trim();

        // Validate input
        if (!guess) {
            this.showValidationError('Please enter a team name!');
            input.focus();
            return;
        }

        // Sanitize input (basic check for XSS)
        if (guess.length > 100) {
            this.showValidationError('Team name is too long. Please enter a valid team name.');
            input.focus();
            return;
        }

        // Increment attempts
        this.attemptsUsed++;
        this.updateAttemptsDisplay();

        // Add to history
        this.guessHistory.push(guess);

        // Check if correct using improved matching
        const isCorrect = this.isGuessCorrect(guess, this.currentTeam.name);

        if (isCorrect) {
            // Win!
            this.gameOver = true;
            setTimeout(() => this.showGameOver(true), 500);
        } else {
            // Wrong guess - show error animation
            input.classList.add('error');
            setTimeout(() => {
                input.classList.remove('error');
            }, 500);
            
            if (this.attemptsUsed >= this.MAX_ATTEMPTS) {
                // Lost - all attempts used
                this.gameOver = true;
                setTimeout(() => this.showGameOver(false), 500);
            } else {
                // Show next clue
                if (this.currentClueIndex < this.CLUES.length - 1) {
                    this.currentClueIndex++;
                    this.updateCluesDisplay();
                }
            }
        }

        // Clear input
        input.value = '';
        input.focus();
    }

    // Show game over overlay
    showGameOver(won) {
        // Disable input
        const input = document.getElementById('guessInput');
        const submitBtn = document.getElementById('submitBtn');
        
        if (input) input.disabled = true;
        if (submitBtn) submitBtn.disabled = true;

        // Create modal using shared modal.css structure
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'modalTitle');
        modal.setAttribute('aria-modal', 'true');
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close" id="modalClose" aria-label="Close modal">×</button>
                <div class="modal-icon" aria-hidden="true">${won ? '🎉' : '😔'}</div>
                <h2 id="modalTitle" class="modal-title ${won ? 'win' : 'lose'}">
                    ${won ? 'GOAL!' : 'GAME OVER'}
                </h2>
                <p class="modal-message">
                    ${won 
                        ? `Congratulations! You guessed it in <strong>${this.attemptsUsed}</strong> ${this.attemptsUsed === 1 ? 'attempt' : 'attempts'}!`
                        : `Nice try! You used all ${this.MAX_ATTEMPTS} attempts.`
                    }
                </p>
                <div class="correct-answer">
                    <div class="correct-answer-label">The team was:</div>
                    <div class="correct-answer-team">
                        <img src="${this.escapeHtml(this.currentTeam.logo)}" alt="${this.escapeHtml(this.currentTeam.name)}" class="correct-answer-logo" loading="lazy">
                        <div class="correct-answer-name">${this.escapeHtml(this.currentTeam.name)}</div>
                    </div>
                </div>
                <div style="display: flex; gap: 12px; justify-content: center; margin-top: 20px; flex-wrap: wrap;">
                    <button class="modal-button" id="restartBtn" aria-label="Play again" style="flex: 1; max-width: 160px; background: rgba(249, 115, 22, 0.25); border-color: rgba(249, 115, 22, 0.4);">
                        Play Again
                    </button>
                    <a href="../index.html" class="modal-button" style="flex: 1; max-width: 160px; display: inline-block; text-decoration: none; background: rgba(255, 255, 255, 0.08); border-color: rgba(249, 115, 22, 0.25);" aria-label="Go to home page">
                        Home
                    </a>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        const restartBtn = modal.querySelector('#restartBtn');
        const closeBtn = modal.querySelector('#modalClose');
        
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restartGame());
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.restartGame());
        }

        // Add click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.restartGame();
            }
        });

        // Trap focus within modal
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.restartGame();
            }
        });
    }

    // Restart game
    restartGame() {
        // Remove modal
        const modal = document.querySelector('.modal');
        if (modal) {
            modal.remove();
        }

        // Remove validation error if present
        const validationError = document.getElementById('validationError');
        if (validationError) {
            validationError.remove();
        }

        // Restart game
        this.initGame();
    }
}

