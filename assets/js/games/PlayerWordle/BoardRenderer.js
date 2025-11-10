// Board Renderer - Handles rendering and updating the game board
class BoardRenderer {
    constructor(boardElementId) {
        this.boardElement = document.getElementById(boardElementId);
        this.targetLength = 0;
        this.maxAttempts = 6;
    }

    // Create the game board
    createBoard(targetLength, maxAttempts = 6) {
        if (!this.boardElement) {
            console.error('Board element not found');
            return;
        }

        // Ensure board is visible before creating
        this.boardElement.style.display = 'flex';

        this.targetLength = targetLength;
        this.maxAttempts = maxAttempts;
        this.boardElement.innerHTML = '';

        for (let row = 0; row < maxAttempts; row++) {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'board-row';
            rowDiv.id = `row-${row}`;

            for (let col = 0; col < targetLength; col++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.id = `tile-${row}-${col}`;
                rowDiv.appendChild(tile);
            }

            this.boardElement.appendChild(rowDiv);
        }

        // Size tiles after creating board
        this.sizeTiles();
        // Recalculate after paint
        try {
            requestAnimationFrame(() => requestAnimationFrame(() => this.sizeTiles()));
        } catch (error) {
            setTimeout(() => this.sizeTiles(), 50);
        }
    }

    // Update board with current guesses
    updateBoard(guesses, currentRow, currentTile, gameOver) {
        for (let row = 0; row < this.maxAttempts; row++) {
            for (let col = 0; col < this.targetLength; col++) {
                const tile = document.getElementById(`tile-${row}-${col}`);
                if (!tile) continue;

                tile.textContent = guesses[row]?.[col] || '';

                // Highlight current tile
                if (row === currentRow && col === currentTile && !gameOver) {
                    tile.classList.add('current');
                } else {
                    tile.classList.remove('current');
                }
            }
        }
    }

    // Color tiles based on guess
    colorTiles(row, guess, target) {
        const targetLetters = target.split('');
        const guessLetters = guess.split('');
        const targetUsed = new Array(target.length).fill(false);
        const tileStatuses = new Array(target.length).fill('absent');

        // First pass: mark correct positions (green)
        for (let i = 0; i < guessLetters.length; i++) {
            if (guessLetters[i] === targetLetters[i]) {
                tileStatuses[i] = 'correct';
                targetUsed[i] = true;
            }
        }

        // Second pass: mark present letters (yellow)
        for (let i = 0; i < guessLetters.length; i++) {
            if (tileStatuses[i] === 'absent') {
                for (let j = 0; j < targetLetters.length; j++) {
                    if (!targetUsed[j] && guessLetters[i] === targetLetters[j]) {
                        tileStatuses[i] = 'present';
                        targetUsed[j] = true;
                        break;
                    }
                }
            }
        }

        // Apply colors with animation delay
        tileStatuses.forEach((status, i) => {
            const tile = document.getElementById(`tile-${row}-${i}`);
            if (!tile) return;

            setTimeout(() => {
                tile.classList.add('flip');
                setTimeout(() => {
                    tile.classList.add(status);
                }, 250);
            }, i * 100);
        });
    }

    // Size tiles to fit available width
    sizeTiles() {
        if (!this.boardElement || this.boardElement.style.display === 'none') {
            return;
        }

        const cols = this.targetLength || 0;
        if (!cols) return;

        const gap = 5;
        const containerWidth = Math.floor(this.boardElement.clientWidth || 0);
        if (!containerWidth) return;

        // Compute ideal tile size
        let tile = Math.floor((containerWidth - gap * (cols - 1)) / cols);

        // Clamp for usability
        const minTile = 28;
        const maxTile = 76;
        tile = Math.max(minTile, Math.min(tile, maxTile));

        // Apply to CSS variables
        this.boardElement.style.setProperty('--tile-size', tile + 'px');
        this.boardElement.style.setProperty('--gap', gap + 'px');
    }

    // Show/hide board
    show() {
        if (this.boardElement) {
            this.boardElement.style.display = 'flex';
        }
    }

    hide() {
        if (this.boardElement) {
            this.boardElement.style.display = 'none';
            // Also clear the board content when hiding
            this.boardElement.innerHTML = '';
        }
    }
}

