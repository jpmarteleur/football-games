// Reusable Stats Functions
function loadStats(storageKey) {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
        return JSON.parse(saved);
    }
    return {
        gamesPlayed: 0,
        gamesWon: 0,
        currentStreak: 0,
        longestStreak: 0
    };
}

function saveStats(storageKey, stats) {
    localStorage.setItem(storageKey, JSON.stringify(stats));
}

function updateStats(storageKey, won) {
    const stats = loadStats(storageKey);
    
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
    
    saveStats(storageKey, stats);
    return stats;
}

function getWinRate(stats) {
    if (stats.gamesPlayed === 0) return 0;
    return Math.round((stats.gamesWon / stats.gamesPlayed) * 100);
}