// True or False Game - Refactored with shared services
class TrueFalseGame {
    constructor() {
        this.currentStreak = 0;
        this.bestStreak = 0;
        this.currentQuestion = null;
        this.isAnswering = false;
        this.teams = [];
        this.players = [];

        // Use shared services
        // Note: True/False uses streak tracking, not full stats
        // We'll use StatsManager but only for longestStreak
        this.statsManager = new StatsManager('trueFalseStats');
        
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.loadBestStreak();
            this.renderGame();
            this.generateQuestion();
        } catch (error) {
            console.error('Error initializing game:', error);
            this.showError('Failed to load game data. Please refresh the page.');
        }
    }

    async loadData() {
        try {
            // Use shared DataService
            dataService.setBasePath('../assets/data');
            await dataService.loadAll();
            
            this.teams = dataService.teams;
            this.players = dataService.players;

            console.log('Data loaded successfully:', {
                teams: this.teams.length,
                players: this.players.length
            });
        } catch (error) {
            console.error('Load data error:', error);
            throw new Error('Failed to load game data: ' + error.message);
        }
    }

    loadBestStreak() {
        const stats = this.statsManager.getStats();
        this.bestStreak = stats.longestStreak || 0;
    }

    saveBestStreak() {
        if (this.currentStreak > this.bestStreak) {
            this.bestStreak = this.currentStreak;
            // Update stats using StatsManager - update as if we won to track streak
            const stats = this.statsManager.getStats();
            // Manually update longest streak since we're tracking ongoing streak
            if (this.currentStreak > (stats.longestStreak || 0)) {
                stats.longestStreak = this.currentStreak;
                this.statsManager.save(stats);
            }
        }
    }

    renderGame() {
        const gameContainer = document.getElementById('gameContainer');
        if (!gameContainer) return;

        gameContainer.innerHTML = `
            <div class="streak-display" id="streakDisplay">
                <div class="streak-icon">🔥</div>
                <div class="streak-text">
                    <div class="current-streak">Current Streak: <span id="currentStreakValue">0</span></div>
                    <div class="best-streak">Best: <span id="bestStreakValue">${this.bestStreak}</span></div>
                </div>
            </div>
            <div class="question-card">
                <div class="question-text" id="questionText">Loading question...</div>
            </div>
            <div class="answer-buttons">
                <button class="answer-btn true-btn" id="trueBtn" onclick="game.answerQuestion(true)">True</button>
                <button class="answer-btn false-btn" id="falseBtn" onclick="game.answerQuestion(false)">False</button>
            </div>
        `;
    }

    generateQuestion() {
        const questionTypes = [
            'playerTeam',
            'playerNationality',
            'playerPosition',
            'teamFoundedYear',
            'teamStadium',
            'teamCity'
        ];

        const randomType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
        
        switch(randomType) {
            case 'playerTeam':
                this.generatePlayerTeamQuestion();
                break;
            case 'playerNationality':
                this.generatePlayerNationalityQuestion();
                break;
            case 'playerPosition':
                this.generatePlayerPositionQuestion();
                break;
            case 'teamFoundedYear':
                this.generateTeamFoundedQuestion();
                break;
            case 'teamStadium':
                this.generateTeamStadiumQuestion();
                break;
            case 'teamCity':
                this.generateTeamCityQuestion();
                break;
        }

        this.displayQuestion();
    }

    generatePlayerTeamQuestion() {
        const player = this.getRandomPlayer();
        if (!player) return;

        const isTrue = Math.random() > 0.5;
        
        if (isTrue) {
            this.currentQuestion = {
                text: `${player.lastName} plays for ${player.team}`,
                answer: true
            };
        } else {
            const wrongTeam = this.getRandomTeam();
            if (wrongTeam) {
                this.currentQuestion = {
                    text: `${player.lastName} plays for ${wrongTeam.name}`,
                    answer: false
                };
            }
        }
    }

    generatePlayerNationalityQuestion() {
        const player = this.getRandomPlayer();
        if (!player) return;

        const isTrue = Math.random() > 0.5;
        
        if (isTrue) {
            this.currentQuestion = {
                text: `${player.lastName} is from ${player.nationality}`,
                answer: true
            };
        } else {
            const wrongNationality = this.getRandomNationality(player.nationality);
            if (wrongNationality) {
                this.currentQuestion = {
                    text: `${player.lastName} is from ${wrongNationality}`,
                    answer: false
                };
            }
        }
    }

    generatePlayerPositionQuestion() {
        const player = this.getRandomPlayer();
        if (!player) return;

        const isTrue = Math.random() > 0.5;
        
        if (isTrue) {
            this.currentQuestion = {
                text: `${player.lastName} is a(n) ${player.position}`,
                answer: true
            };
        } else {
            const wrongPosition = this.getRandomPosition(player.position);
            if (wrongPosition) {
                this.currentQuestion = {
                    text: `${player.lastName} is a(n) ${wrongPosition}`,
                    answer: false
                };
            }
        }
    }

    generateTeamFoundedQuestion() {
        const team = this.getRandomTeam();
        if (!team) return;

        const isTrue = Math.random() > 0.5;
        
        if (isTrue) {
            this.currentQuestion = {
                text: `${team.name} was founded in ${team.founded}`,
                answer: true
            };
        } else {
            const wrongYear = this.getRandomYear(team.founded);
            this.currentQuestion = {
                text: `${team.name} was founded in ${wrongYear}`,
                answer: false
            };
        }
    }

    generateTeamStadiumQuestion() {
        const team = this.getRandomTeam();
        if (!team) return;

        const isTrue = Math.random() > 0.5;
        
        if (isTrue) {
            this.currentQuestion = {
                text: `${team.name} plays at ${team.stadium}`,
                answer: true
            };
        } else {
            const wrongTeam = this.getRandomTeam(team.id);
            if (wrongTeam) {
                this.currentQuestion = {
                    text: `${team.name} plays at ${wrongTeam.stadium}`,
                    answer: false
                };
            }
        }
    }

    generateTeamCityQuestion() {
        const team = this.getRandomTeam();
        if (!team) return;

        const isTrue = Math.random() > 0.5;
        
        if (isTrue) {
            this.currentQuestion = {
                text: `${team.name} is based in ${team.city}`,
                answer: true
            };
        } else {
            const wrongTeam = this.getRandomTeam(team.id);
            if (wrongTeam) {
                this.currentQuestion = {
                    text: `${team.name} is based in ${wrongTeam.city}`,
                    answer: false
                };
            }
        }
    }

    displayQuestion() {
        const questionText = document.getElementById('questionText');
        if (questionText && this.currentQuestion) {
            questionText.textContent = this.currentQuestion.text;
        }
        this.enableButtons();
    }

    answerQuestion(userAnswer) {
        if (this.isAnswering || !this.currentQuestion) return;
        
        this.isAnswering = true;
        this.disableButtons();
        
        const isCorrect = userAnswer === this.currentQuestion.answer;
        const trueBtn = document.getElementById('trueBtn');
        const falseBtn = document.getElementById('falseBtn');
        
        // Show correct/incorrect animation
        if (userAnswer) {
            if (trueBtn) {
                trueBtn.classList.add(isCorrect ? 'correct' : 'incorrect');
            }
        } else {
            if (falseBtn) {
                falseBtn.classList.add(isCorrect ? 'correct' : 'incorrect');
            }
        }
        
        if (isCorrect) {
            this.currentStreak++;
            this.updateStreakDisplay();
            
            setTimeout(() => {
                if (trueBtn) trueBtn.classList.remove('correct');
                if (falseBtn) falseBtn.classList.remove('correct');
                this.isAnswering = false;
                this.generateQuestion();
            }, 200);
        } else {
            // Game Over
            setTimeout(() => {
                this.saveBestStreak();
                this.showGameOverModal();
            }, 800);
        }
    }

    updateStreakDisplay() {
        const currentStreakValue = document.getElementById('currentStreakValue');
        const bestStreakValue = document.getElementById('bestStreakValue');
        
        if (currentStreakValue) {
            currentStreakValue.textContent = this.currentStreak;
        }
        if (this.currentStreak > this.bestStreak && bestStreakValue) {
            this.bestStreak = this.currentStreak;
            bestStreakValue.textContent = this.currentStreak;
        }
    }

    showGameOverModal() {
        const funMessages = [
            "Keep pushing! Every champion started somewhere!",
            "Great effort! You're getting better with every game!",
            "Nice try! The best is yet to come!",
            "Don't give up! Champions are made in practice!",
            "Awesome attempt! You're on the right track!",
            "Well played! Your skills are improving!",
            "Good game! Ready for another round?",
            "Solid effort! Practice makes perfect!"
        ];

        const randomMessage = funMessages[Math.floor(Math.random() * funMessages.length)];
        const isNewRecord = this.currentStreak === this.bestStreak && this.currentStreak > 0;

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'gameOverModal';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close" id="modalClose" aria-label="Close modal">&times;</button>
                <div class="game-over-content">
                    <h2>Game Over! 🎮</h2>
                    <div class="streak-label">Your Streak</div>
                    <div class="streak-result">${this.currentStreak}</div>
                    ${isNewRecord ? '<div class="best-streak-badge">🎉 NEW RECORD! 🎉</div>' : ''}
                    <div class="fun-message">${randomMessage}</div>
                    <div style="display: flex; gap: 12px; justify-content: center; margin-top: 20px; flex-wrap: wrap;">
                        <button class="modal-button" id="playAgainBtn" style="flex: 1; max-width: 160px; background: rgba(249, 115, 22, 0.25); border-color: rgba(249, 115, 22, 0.4);">
                            Play Again
                        </button>
                        <a href="../index.html" class="modal-button" style="flex: 1; max-width: 160px; display: inline-block; text-decoration: none; background: rgba(255, 255, 255, 0.08); border-color: rgba(249, 115, 22, 0.25);" aria-label="Go to home page">
                            Home
                        </a>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        // Add button event listeners
        const playAgainBtn = document.getElementById('playAgainBtn');
        const closeBtn = document.getElementById('modalClose');
        
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => this.playAgain());
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.playAgain());
        }
    }

    playAgain() {
        const modal = document.getElementById('gameOverModal');
        if (modal) {
            modal.remove();
        }
        
        this.currentStreak = 0;
        this.isAnswering = false;
        this.updateStreakDisplay();
        
        const trueBtn = document.getElementById('trueBtn');
        const falseBtn = document.getElementById('falseBtn');
        if (trueBtn) trueBtn.classList.remove('correct', 'incorrect');
        if (falseBtn) falseBtn.classList.remove('correct', 'incorrect');
        
        this.generateQuestion();
    }

    enableButtons() {
        const trueBtn = document.getElementById('trueBtn');
        const falseBtn = document.getElementById('falseBtn');
        if (trueBtn) trueBtn.disabled = false;
        if (falseBtn) falseBtn.disabled = false;
    }

    disableButtons() {
        const trueBtn = document.getElementById('trueBtn');
        const falseBtn = document.getElementById('falseBtn');
        if (trueBtn) trueBtn.disabled = true;
        if (falseBtn) falseBtn.disabled = true;
    }

    // Helper methods using DataService
    getRandomPlayer() {
        return dataService.getRandomPlayer();
    }

    getRandomTeam(excludeId = null) {
        return dataService.getRandomTeam(excludeId);
    }

    getRandomNationality(exclude = null) {
        const nationalities = [...new Set(this.players.map(p => p.nationality))];
        let filtered = nationalities;
        if (exclude) {
            filtered = nationalities.filter(n => n !== exclude);
        }
        return filtered.length > 0 ? filtered[Math.floor(Math.random() * filtered.length)] : null;
    }

    getRandomPosition(exclude = null) {
        const positions = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker'];
        let filtered = positions;
        if (exclude) {
            filtered = positions.filter(p => p !== exclude);
        }
        return filtered[Math.floor(Math.random() * filtered.length)];
    }

    getRandomYear(actualYear) {
        const offset = Math.floor(Math.random() * 30) + 5;
        const direction = Math.random() > 0.5 ? 1 : -1;
        return actualYear + (offset * direction);
    }

    showError(message) {
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--error-color, #ff0000);">
                    <p>${message}</p>
                </div>
            `;
        }
    }
}

