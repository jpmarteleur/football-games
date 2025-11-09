// True or False Game Logic
class TrueFalseGame {
    constructor() {
        this.teams = [];
        this.players = [];
        this.currentStreak = 0;
        this.bestStreak = 0;
        this.currentQuestion = null;
        this.isAnswering = false;
        
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
            const [teamsResponse, playersResponse] = await Promise.all([
                fetch('../assets/data/teams.json'),
                fetch('../assets/data/full-players.json')
            ]);

            if (!teamsResponse.ok) {
                throw new Error(`Failed to load teams: ${teamsResponse.status}`);
            }
            if (!playersResponse.ok) {
                throw new Error(`Failed to load players: ${playersResponse.status}`);
            }

            this.teams = await teamsResponse.json();
            const playersData = await playersResponse.json();
            
            // Handle if players are wrapped in an object
            this.players = playersData.players || playersData;

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
        const saved = localStorage.getItem('trueFalseBestStreak');
        this.bestStreak = saved ? parseInt(saved) : 0;
    }

    saveBestStreak() {
        if (this.currentStreak > this.bestStreak) {
            this.bestStreak = this.currentStreak;
            localStorage.setItem('trueFalseBestStreak', this.bestStreak.toString());
        }
    }

    renderGame() {
        const gameContainer = document.getElementById('gameContainer');
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
        const isTrue = Math.random() > 0.5;
        
        if (isTrue) {
            this.currentQuestion = {
                text: `${player.lastName} plays for ${player.team}`,
                answer: true
            };
        } else {
            const wrongTeam = this.getRandomTeam();
            this.currentQuestion = {
                text: `${player.lastName} plays for ${wrongTeam.name}`,
                answer: false
            };
        }
    }

    generatePlayerNationalityQuestion() {
        const player = this.getRandomPlayer();
        const isTrue = Math.random() > 0.5;
        
        if (isTrue) {
            this.currentQuestion = {
                text: `${player.lastName} is from ${player.nationality}`,
                answer: true
            };
        } else {
            const wrongNationality = this.getRandomNationality(player.nationality);
            this.currentQuestion = {
                text: `${player.lastName} is from ${wrongNationality}`,
                answer: false
            };
        }
    }

    generatePlayerPositionQuestion() {
        const player = this.getRandomPlayer();
        const isTrue = Math.random() > 0.5;
        
        if (isTrue) {
            this.currentQuestion = {
                text: `${player.lastName} is a(n) ${player.position}`,
                answer: true
            };
        } else {
            const wrongPosition = this.getRandomPosition(player.position);
            this.currentQuestion = {
                text: `${player.lastName} is a(n) ${wrongPosition}`,
                answer: false
            };
        }
    }

    generateTeamFoundedQuestion() {
        const team = this.getRandomTeam();
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
        const isTrue = Math.random() > 0.5;
        
        if (isTrue) {
            this.currentQuestion = {
                text: `${team.name} plays at ${team.stadium}`,
                answer: true
            };
        } else {
            const wrongTeam = this.getRandomTeam(team.id);
            this.currentQuestion = {
                text: `${team.name} plays at ${wrongTeam.stadium}`,
                answer: false
            };
        }
    }

    generateTeamCityQuestion() {
        const team = this.getRandomTeam();
        const isTrue = Math.random() > 0.5;
        
        if (isTrue) {
            this.currentQuestion = {
                text: `${team.name} is based in ${team.city}`,
                answer: true
            };
        } else {
            const wrongTeam = this.getRandomTeam(team.id);
            this.currentQuestion = {
                text: `${team.name} is based in ${wrongTeam.city}`,
                answer: false
            };
        }
    }

    displayQuestion() {
        const questionText = document.getElementById('questionText');
        questionText.textContent = this.currentQuestion.text;
        this.enableButtons();
    }

    answerQuestion(userAnswer) {
        if (this.isAnswering) return;
        
        this.isAnswering = true;
        this.disableButtons();
        
        const isCorrect = userAnswer === this.currentQuestion.answer;
        const trueBtn = document.getElementById('trueBtn');
        const falseBtn = document.getElementById('falseBtn');
        
        // Show correct/incorrect animation
        if (userAnswer) {
            trueBtn.classList.add(isCorrect ? 'correct' : 'incorrect');
        } else {
            falseBtn.classList.add(isCorrect ? 'correct' : 'incorrect');
        }
        
        if (isCorrect) {
            this.currentStreak++;
            this.updateStreakDisplay();
            
            setTimeout(() => {
                trueBtn.classList.remove('correct');
                falseBtn.classList.remove('correct');
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
        document.getElementById('currentStreakValue').textContent = this.currentStreak;
        if (this.currentStreak > this.bestStreak) {
            document.getElementById('bestStreakValue').textContent = this.currentStreak;
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
                <div class="game-over-content">
                    <h2>Game Over! 🎮</h2>
                    <div class="streak-label">Your Streak</div>
                    <div class="streak-result">${this.currentStreak}</div>
                    ${isNewRecord ? '<div class="best-streak-badge">🎉 NEW RECORD! 🎉</div>' : ''}
                    <div class="fun-message">${randomMessage}</div>
                    <button class="play-again-btn" onclick="game.playAgain()">Play Again</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
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
        trueBtn.classList.remove('correct', 'incorrect');
        falseBtn.classList.remove('correct', 'incorrect');
        
        this.generateQuestion();
    }

    enableButtons() {
        document.getElementById('trueBtn').disabled = false;
        document.getElementById('falseBtn').disabled = false;
    }

    disableButtons() {
        document.getElementById('trueBtn').disabled = true;
        document.getElementById('falseBtn').disabled = true;
    }

    // Helper methods
    getRandomPlayer() {
        return this.players[Math.floor(Math.random() * this.players.length)];
    }

    getRandomTeam(excludeId = null) {
        let filteredTeams = this.teams;
        if (excludeId) {
            filteredTeams = this.teams.filter(t => t.id !== excludeId);
        }
        return filteredTeams[Math.floor(Math.random() * filteredTeams.length)];
    }

    getRandomNationality(exclude = null) {
        const nationalities = [...new Set(this.players.map(p => p.nationality))];
        let filtered = nationalities;
        if (exclude) {
            filtered = nationalities.filter(n => n !== exclude);
        }
        return filtered[Math.floor(Math.random() * filtered.length)];
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
        gameContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--error-color);">
                <p>${message}</p>
            </div>
        `;
    }
}

// Initialize game when page loads
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new TrueFalseGame();
});
