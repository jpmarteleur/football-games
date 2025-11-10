// Unified Data Service - Loads data from JSON files
class DataService {
    constructor() {
        this.players = null;
        this.teams = null;
        this.basePath = '../assets/data';
    }

    // Set base path for data files (useful for different directory structures)
    setBasePath(path) {
        this.basePath = path;
    }

    // Load players from JSON file
    async loadPlayers() {
        if (this.players) {
            return this.players;
        }

        try {
            const response = await fetch(`${this.basePath}/full-players.json`);
            if (!response.ok) {
                throw new Error(`Failed to load players: ${response.status}`);
            }

            const data = await response.json();
            this.players = data.players || data;
            console.log(`✅ Loaded ${this.players.length} players`);
            return this.players;
        } catch (error) {
            console.error('❌ Error loading players:', error);
            throw new Error('Failed to load players data');
        }
    }

    // Load teams from JSON file
    async loadTeams() {
        if (this.teams) {
            return this.teams;
        }

        try {
            const response = await fetch(`${this.basePath}/teams.json`);
            if (!response.ok) {
                throw new Error(`Failed to load teams: ${response.status}`);
            }

            this.teams = await response.json();
            console.log(`✅ Loaded ${this.teams.length} teams`);
            return this.teams;
        } catch (error) {
            console.error('❌ Error loading teams:', error);
            throw new Error('Failed to load teams data');
        }
    }

    // Load both players and teams
    async loadAll() {
        try {
            await Promise.all([
                this.loadPlayers(),
                this.loadTeams()
            ]);
            return {
                players: this.players,
                teams: this.teams
            };
        } catch (error) {
            console.error('❌ Error loading data:', error);
            throw error;
        }
    }

    // Get player by last name
    getPlayerByLastName(lastName) {
        if (!this.players) return null;
        return this.players.find(p => 
            p.lastName.toUpperCase() === lastName.toUpperCase()
        );
    }

    // Get team by name
    getTeamByName(name) {
        if (!this.teams) return null;
        return this.teams.find(t => 
            t.name.toLowerCase() === name.toLowerCase()
        );
    }

    // Get team by ID
    getTeamById(id) {
        if (!this.teams) return null;
        return this.teams.find(t => t.id === id);
    }

    // Get random player
    getRandomPlayer() {
        if (!this.players || this.players.length === 0) return null;
        return this.players[Math.floor(Math.random() * this.players.length)];
    }

    // Get random team
    getRandomTeam(excludeId = null) {
        if (!this.teams || this.teams.length === 0) return null;
        let filtered = this.teams;
        if (excludeId) {
            filtered = this.teams.filter(t => t.id !== excludeId);
        }
        return filtered[Math.floor(Math.random() * filtered.length)];
    }

    // Filter players by criteria
    filterPlayers(criteria) {
        if (!this.players) return [];
        return this.players.filter(player => {
            if (criteria.minLength && player.lastName.length < criteria.minLength) return false;
            if (criteria.maxLength && player.lastName.length > criteria.maxLength) return false;
            if (criteria.team && player.team !== criteria.team) return false;
            if (criteria.nationality && player.nationality !== criteria.nationality) return false;
            if (criteria.position && player.position !== criteria.position) return false;
            return true;
        });
    }
}

// Export singleton instance
const dataService = new DataService();

