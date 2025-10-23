// Player Data Manager - Handles API fetching and caching
// Version 3.0 - Now saves FULL player data (photos, teams, stats, etc.)

const PlayerDataManager = {
    // Check if cached data exists and is still valid
    isCacheValid() {
        const cached = localStorage.getItem(CONFIG.CACHE_KEY);
        if (!cached) return false;
        
        try {
            const data = JSON.parse(cached);
            const now = Date.now();
            const cacheAge = now - data.timestamp;
            
            // Check if cache is less than 24 hours old
            return cacheAge < CONFIG.CACHE_DURATION;
        } catch (error) {
            console.error('Error reading cache:', error);
            return false;
        }
    },
    
    // Get cached players
    getCachedPlayers() {
        try {
            const cached = localStorage.getItem(CONFIG.CACHE_KEY);
            if (!cached) return null;
            
            const data = JSON.parse(cached);
            return data.players;
        } catch (error) {
            console.error('Error getting cached players:', error);
            return null;
        }
    },
    
    // Save players to cache
    saveToCache(players) {
        try {
            const data = {
                players: players,
                timestamp: Date.now(),
                version: '3.0', // Updated version with full player data
                totalPlayers: players.length
            };
            localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(data));
            console.log(`✅ Cached ${players.length} players with full data`);
        } catch (error) {
            console.error('Error saving to cache:', error);
        }
    },
    
    // Filter and clean player name - Extract LAST NAME only
    cleanPlayerName(name) {
        // Convert to uppercase
        name = name.toUpperCase();
        
        // Remove special characters and keep only letters and spaces
        name = name.replace(/[^A-Z\s]/g, '');
        
        // Trim spaces
        name = name.trim();
        
        // Extract last name (last word after splitting by space)
        const parts = name.split(/\s+/);
        const lastName = parts[parts.length - 1];
        
        return lastName;
    },
    
    // Check if player name is good for Wordle
    isValidWordleName(name) {
        // Must be between 4 and 12 letters
        if (name.length < 4 || name.length > 12) {
            return false;
        }
        
        // Must not contain spaces (single name only)
        if (name.includes(' ')) {
            return false;
        }
        
        // Must only contain letters
        if (!/^[A-Z]+$/.test(name)) {
            return false;
        }
        
        return true;
    },
    
    // Fetch players from a single team with full stats
    async fetchTeamPlayers(teamId, teamName) {
        try {
            const url = `${CONFIG.API_BASE_URL}/players?team=${teamId}&season=${CONFIG.SEASON}`;
            
            const response = await fetch(url, {
                headers: {
                    'x-rapidapi-key': CONFIG.API_KEY,
                    'x-rapidapi-host': 'v3.football.api-sports.io'
                }
            });
            
            const data = await response.json();
            
            if (response.ok && data.response) {
                // Extract FULL player data with combined stats from ALL competitions
                const players = data.response.map(p => {
                    // Sum stats across ALL competitions (La Liga, Champions League, etc.)
                    let totalAppearances = 0;
                    let totalMinutes = 0;
                    let totalLineups = 0;
                    let totalGoals = 0;
                    let totalAssists = 0;
                    let position = 'Unknown';
                    
                    if (p.statistics && Array.isArray(p.statistics)) {
                        p.statistics.forEach(stat => {
                            const games = stat.games || {};
                            const goals = stat.goals || {};
                            totalAppearances += games.appearences || 0;
                            totalMinutes += games.minutes || 0;
                            totalLineups += games.lineups || 0;
                            totalGoals += goals.total || 0;
                            totalAssists += goals.assists || 0;
                            
                            // Get position from first valid entry
                            if (!position || position === 'Unknown') {
                                position = games.position || 'Unknown';
                            }
                        });
                    }
                    
                    return {
                        // Basic Info
                        id: p.player.id,
                        lastName: this.cleanPlayerName(p.player.name),
                        age: p.player.age,
                        nationality: p.player.nationality,
                        photo: p.player.photo,
                        
                        // Team Info
                        team: teamName,
                        
                        // Position
                        position: position,
                        
                        // Stats (only for filtering, not saved to final data)
                        _filterStats: {
                            appearances: totalAppearances,
                            minutes: totalMinutes,
                            lineups: totalLineups
                        }
                    };
                });
                
                console.log(`✅ Fetched ${players.length} players from ${teamName}`);
                return players;
            } else {
                console.error(`❌ Failed to fetch ${teamName}:`, data.errors);
                return [];
            }
        } catch (error) {
            console.error(`❌ Error fetching ${teamName}:`, error);
            return [];
        }
    },
    
    // Filter to keep only quality/starter players
    filterQualityPlayers(players) {
        console.log(`🔍 Filtering ${players.length} players...`);
        
        // Step 1: Keep only valid Wordle names
        let filtered = players.filter(p => this.isValidWordleName(p.lastName));
        console.log(`After name validation: ${filtered.length} players`);
        
        // Step 2: BALANCED - Keep players with decent playing time
        // At least 15 appearances AND 10 lineups AND 800+ minutes
        filtered = filtered.filter(p => {
            return p._filterStats.appearances >= 15 && p._filterStats.lineups >= 10 && p._filterStats.minutes >= 800;
        });
        console.log(`After playing time filter (BALANCED): ${filtered.length} players`);
        
        // Step 3: Sort by quality score (appearances + lineups priority)
        filtered.sort((a, b) => {
            const scoreA = (a._filterStats.lineups * 3) + a._filterStats.appearances;
            const scoreB = (b._filterStats.lineups * 3) + b._filterStats.appearances;
            return scoreB - scoreA;
        });
        
        // Step 4: Remove duplicates (keep the one with better stats)
        const uniqueMap = new Map();
        filtered.forEach(player => {
            if (!uniqueMap.has(player.lastName)) {
                uniqueMap.set(player.lastName, player);
            }
        });
        
        const result = Array.from(uniqueMap.values());
        
        // Step 5: Remove the temporary filter stats from final data
        result.forEach(player => {
            delete player._filterStats;
        });
        
        console.log(`✅ Final filtered list: ${result.length} quality players`);
        
        return result;
    },
    
    // Fetch all players from all teams
    async fetchAllPlayers(onProgress = null) {
        const allPlayers = [];
        const teams = Object.entries(CONFIG.TARGET_TEAMS);
        let completed = 0;
        
        for (const [teamName, teamId] of teams) {
            // Update progress if callback provided
            if (onProgress) {
                onProgress({
                    current: completed + 1,
                    total: teams.length,
                    teamName: teamName
                });
            }
            
            const players = await this.fetchTeamPlayers(teamId, teamName);
            allPlayers.push(...players);
            
            completed++;
            
            // Wait 1 second between requests
            if (completed < teams.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        console.log(`✅ Total players fetched: ${allPlayers.length}`);
        
        // Filter to quality players only
        const qualityPlayers = this.filterQualityPlayers(allPlayers);
        
        // Save full player data
        return qualityPlayers;
    },
    
    // Get just player names for Wordle (backward compatibility)
    getPlayerNames(fullPlayerData) {
        return fullPlayerData.map(p => p.lastName);
    },
    
    // Export full data to JSON format (for saving to file)
    exportToJSON(fullPlayerData) {
        return JSON.stringify({
            version: "3.0",
            lastUpdated: new Date().toISOString(),
            totalPlayers: fullPlayerData.length,
            players: fullPlayerData
        }, null, 2);
    },
    
    // Main function: Get players (from cache or API)
    async getPlayers(onProgress = null) {
        // Check cache first
        if (this.isCacheValid()) {
            console.log('📦 Using cached players');
            const cached = this.getCachedPlayers();
            if (cached && cached.length > 0) {
                return cached;
            }
        }
        
        console.log('🌐 Fetching fresh player data from API...');
        console.log('⚠️ This will take about 20-30 seconds (11 teams with 2-second delays)');
        
        // Fetch from API
        const players = await this.fetchAllPlayers(onProgress);
        
        // Save to cache
        if (players.length > 0) {
            this.saveToCache(players);
        }
        
        return players;
    },
    
    // Fallback to local JSON if API fails
    async getFallbackPlayers() {
        try {
            const response = await fetch('../assets/data/players.json');
            const data = await response.json();
            console.log('📄 Using fallback player list');
            return data.players;
        } catch (error) {
            console.error('❌ Error loading fallback players:', error);
            return ['MESSI', 'RONALDO', 'NEYMAR']; // Emergency fallback
        }
    },
    
    // Load players from local JSON file
    async loadFromJSON() {
        try {
            const response = await fetch('../assets/data/full-players.json');
            const data = await response.json();
            console.log(`📄 Loaded ${data.totalPlayers} players from JSON file`);
            return data.players;
        } catch (error) {
            console.error('❌ Error loading JSON file:', error);
            return null;
        }
    },
    
    // Smart get: Try JSON -> cache -> API -> emergency fallback
    async getPlayersWithFallback(onProgress = null) {
        try {
            // PRIORITY 1: Try loading from JSON file first
            const jsonPlayers = await this.loadFromJSON();
            if (jsonPlayers && jsonPlayers.length > 0) {
                console.log('✅ Using players from JSON file');
                return jsonPlayers;
            }
            
            // PRIORITY 2: Try cache/API
            const players = await this.getPlayers(onProgress);
            
            if (players.length > 0) {
                return players;
            } else {
                // PRIORITY 3: Emergency fallback (hardcoded names)
                console.warn('⚠️ No players from JSON or API, using emergency fallback');
                return ['MESSI', 'RONALDO', 'NEYMAR', 'HAALAND', 'MBAPPE'];
            }
        } catch (error) {
            console.error('❌ Error fetching players:', error);
            // Emergency fallback
            return ['MESSI', 'RONALDO', 'NEYMAR', 'HAALAND', 'MBAPPE'];
        }
    },
    
    // Clear cache (useful for testing)
    clearCache() {
        localStorage.removeItem(CONFIG.CACHE_KEY);
        console.log('🗑️ Cache cleared');
    }
};