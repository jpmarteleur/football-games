// Unified Stats Manager - Handles statistics for all games
class StatsManager {
    constructor(storageKey) {
        this.storageKey = storageKey;
    }

    // Load stats from localStorage
    load() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (error) {
                console.error('Error parsing stats:', error);
                return this.getDefaultStats();
            }
        }
        return this.getDefaultStats();
    }

    // Get default stats structure
    getDefaultStats() {
        return {
            gamesPlayed: 0,
            gamesWon: 0,
            currentStreak: 0,
            longestStreak: 0
        };
    }

    // Save stats to localStorage
    save(stats) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(stats));
        } catch (error) {
            console.error('Error saving stats:', error);
        }
    }

    // Update stats after a game
    update(won) {
        const stats = this.load();
        stats.gamesPlayed++;

        if (won) {
            stats.gamesWon++;
            stats.currentStreak++;

            if (stats.currentStreak > stats.longestStreak) {
                stats.longestStreak = stats.currentStreak;
            }
        } else {
            stats.currentStreak = 0;
        }

        this.save(stats);
        return stats;
    }

    // Calculate win rate percentage
    getWinRate(stats = null) {
        const currentStats = stats || this.load();
        if (currentStats.gamesPlayed === 0) return 0;
        return Math.round((currentStats.gamesWon / currentStats.gamesPlayed) * 100);
    }

    // Reset stats
    reset() {
        this.save(this.getDefaultStats());
    }

    // Get current stats
    getStats() {
        return this.load();
    }
}

