// Difficulty Manager - Handles difficulty settings and filtering
class DifficultyManager {
    constructor() {
        this.difficultySettings = {
            easy: {
                nameLength: { min: 8, max: 12 },
                showNationality: true,
                showPosition: true,
                label: 'EASY'
            },
            medium: {
                nameLength: { min: 5, max: 10 },
                showNationality: true,
                showPosition: false,
                label: 'MEDIUM'
            },
            hard: {
                nameLength: { min: 4, max: 7 },
                showNationality: false,
                showPosition: false,
                label: 'HARD'
            }
        };

        this.storageKey = 'wordleDifficulty';
        this.currentDifficulty = null;
    }

    // Get difficulty settings
    getSettings(difficulty) {
        return this.difficultySettings[difficulty] || null;
    }

    // Get all difficulty options
    getDifficulties() {
        return Object.keys(this.difficultySettings);
    }

    // Set current difficulty
    setDifficulty(difficulty) {
        if (this.difficultySettings[difficulty]) {
            this.currentDifficulty = difficulty;
            this.saveDifficulty();
            return true;
        }
        return false;
    }

    // Get current difficulty
    getCurrentDifficulty() {
        return this.currentDifficulty;
    }

    // Load saved difficulty from localStorage
    loadDifficulty() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved && this.difficultySettings[saved]) {
            this.currentDifficulty = saved;
            return saved;
        }
        return null;
    }

    // Save difficulty to localStorage
    saveDifficulty() {
        if (this.currentDifficulty) {
            localStorage.setItem(this.storageKey, this.currentDifficulty);
        }
    }

    // Filter players by difficulty
    filterPlayers(players, difficulty) {
        const settings = this.getSettings(difficulty);
        if (!settings) return [];

        return players.filter(player => {
            const nameLength = player.lastName.length;
            return nameLength >= settings.nameLength.min && 
                   nameLength <= settings.nameLength.max;
        });
    }

    // Get random player for difficulty
    getRandomPlayer(players, difficulty) {
        const filtered = this.filterPlayers(players, difficulty);
        if (filtered.length === 0) return null;
        return filtered[Math.floor(Math.random() * filtered.length)];
    }
}

