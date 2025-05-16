import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

interface Position {
    x: number;
    y: number;
}

interface MazeCell {
    x: number;
    y: number;
    walls: {
        top: boolean;
        right: boolean;
        bottom: boolean;
        left: boolean;
    };
    visited: boolean;
}

interface Penguin {
    sprite: Phaser.GameObjects.Sprite;
    cell: Position;
    color: number;
    previousPositions: Position[];
    direction: 'up' | 'right' | 'down' | 'left';
}

export class PenguinPursuitGameplayScene extends Scene {
    // Game objects
    private maze: MazeCell[][] = [];
    private mazeGraphics: Phaser.GameObjects.Graphics;
    private mazeSize: number = 8; // Default size
    private cellSize: number = 0;
    private playerPenguin: Penguin;
    private enemyPenguin: Penguin;
    private fish: Phaser.GameObjects.Sprite;
    private mazeContainer: Phaser.GameObjects.Container;
    private mazeRotationAngle: number = 0;
    private mazeRotationTimer: Phaser.Time.TimerEvent;
    private directionIndicator: Phaser.GameObjects.Container; // New property for direction indicator
    
    // Countdown timer
    private countdownText: Phaser.GameObjects.Text;
    private countdownBackground: Phaser.GameObjects.Graphics;
    private isCountdownActive: boolean = true;

    // Game state
    private score: number = 0;
    private difficulty: 'normal' | 'hard' = 'normal';
    private currentTrial: number = 1;
    private totalTrials: number = 8;
    private isGameOver: boolean = false;
    private isRoundComplete: boolean = false;
    private playerMoving: boolean = false;
    private enemyMoving: boolean = false;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;

    // UI elements
    private uiHeader: Phaser.GameObjects.Container;
    private scoreText: Phaser.GameObjects.Text;
    private trialText: Phaser.GameObjects.Text;
    private difficultyButton: Phaser.GameObjects.Container;
    private resultText: Phaser.GameObjects.Text;

    constructor() {
        super('PenguinPursuitGameplayScene');
    }

    create() {
        // Set scene background image
        const sceneBg = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'scene-bg');
        sceneBg.setOrigin(0.5, 0.5);
        // Scale to fit screen, maintaining aspect ratio (cover)
        const scaleX = this.cameras.main.width / sceneBg.width;
        const scaleY = this.cameras.main.height / sceneBg.height;
        sceneBg.setScale(Math.max(scaleX, scaleY));
        sceneBg.setDepth(-1); // Ensure it's behind everything

        // Create animations
        this.createAnimations();

        // Create maze container at the center of the screen
        const centerX = this.cameras.main.width / 2;
        const centerY = (this.cameras.main.height / 2) + 50; // Add some top padding
        this.mazeContainer = this.add.container(centerX, centerY);

        // Add maze background to the container
        // It will be drawn first, so it appears behind other elements added later to the container
        const mazeBgImage = this.add.image(0, 0, 'maze-bg'); // Centered in the container
        mazeBgImage.setOrigin(0.5, 0.5);
        // We will resize it in drawMaze after cellSize is known, to fit the maze precisely
        this.mazeContainer.add(mazeBgImage); 
        
        // Reset maze rotation
        this.mazeContainer.setAngle(0);

        // Initialize the level
        this.initializeLevel();

        // Create maze
        this.createMaze();
        
        // Setup game objects
        this.setupGameObjects();
        
        // Create UI
        this.createUI();
        
        // Setup input
        this.setupInput();

        // Setup maze rotation timer (but it won't start until countdown finishes)
        this.setupMazeRotation();
        
        // Create and start countdown
        this.createCountdown();
        
        // Emit event that scene is ready
        EventBus.emit('current-scene-ready', this);
    }

    private createAnimations() {
        // Player animations
        this.anims.create({
            key: 'player-up',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
        
        this.anims.create({
            key: 'player-right',
            frames: this.anims.generateFrameNumbers('player', { start: 4, end: 7 }),
            frameRate: 10,
            repeat: -1
        });
        
        this.anims.create({
            key: 'player-down',
            frames: this.anims.generateFrameNumbers('player', { start: 8, end: 11 }),
            frameRate: 10,
            repeat: -1
        });
        
        this.anims.create({
            key: 'player-left',
            frames: this.anims.generateFrameNumbers('player', { start: 12, end: 15 }),
            frameRate: 10,
            repeat: -1
        });
        
        // Enemy animations
        this.anims.create({
            key: 'enemy-up',
            frames: this.anims.generateFrameNumbers('enemy', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
        
        this.anims.create({
            key: 'enemy-right',
            frames: this.anims.generateFrameNumbers('enemy', { start: 4, end: 7 }),
            frameRate: 10,
            repeat: -1
        });
        
        this.anims.create({
            key: 'enemy-down',
            frames: this.anims.generateFrameNumbers('enemy', { start: 8, end: 11 }),
            frameRate: 10,
            repeat: -1
        });
        
        this.anims.create({
            key: 'enemy-left',
            frames: this.anims.generateFrameNumbers('enemy', { start: 12, end: 15 }),
            frameRate: 10,
            repeat: -1
        });
    }

    update() {
        if (this.isCountdownActive || this.isRoundComplete || this.isGameOver) return;

        // Handle player movement based on keyboard input
        this.handlePlayerInput();
        
        // Handle enemy AI movement (if player isn't moving)
        if (!this.playerMoving && !this.enemyMoving) {
            this.moveEnemyPenguin();
        }
        
        // Check win/lose conditions
        this.checkWinLoseConditions();
    }

    private createCountdown() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        
        // Create blurred background
        this.countdownBackground = this.add.graphics();
        this.countdownBackground.fillStyle(0x000000, 0.6);
        this.countdownBackground.fillRoundedRect(centerX - 75, centerY - 75, 150, 150, 20);
        this.countdownBackground.setDepth(1000);
        
        // Create countdown text
        this.countdownText = this.add.text(centerX, centerY, '3', {
            fontFamily: 'Arial',
            fontSize: '100px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        this.countdownText.setOrigin(0.5);
        this.countdownText.setDepth(1001);
        
        // Start countdown sequence
        this.isCountdownActive = true;
        this.time.delayedCall(1000, () => {
            this.countdownText.setText('2');
            this.time.delayedCall(1000, () => {
                this.countdownText.setText('1');
                this.time.delayedCall(1000, () => {
                    this.countdownText.setText('GO!');
                    this.time.delayedCall(500, () => {
                        // Hide countdown elements and start game
                        this.countdownText.setVisible(false);
                        this.countdownBackground.setVisible(false);
                        this.isCountdownActive = false;
                        
                        // Start maze rotation
                        this.setupMazeRotation();
                    });
                });
            });
        });
    }

    private initializeLevel() {
        // Reset game state
        this.isRoundComplete = false;
        this.playerMoving = false;
        this.enemyMoving = false;
        this.isCountdownActive = true;
        
        // Adjust maze size based on difficulty and current trial
        if (this.difficulty === 'normal') {
            this.mazeSize = Math.min(8 + Math.floor(this.currentTrial / 2), 12);
        } else { // hard
            this.mazeSize = Math.min(10 + Math.floor(this.currentTrial / 2), 15);
        }
        
        // Calculate cell size based on available screen space
        const availableWidth = this.cameras.main.width * 0.8;
        const availableHeight = this.cameras.main.height * 0.7;
        this.cellSize = Math.min(
            availableWidth / this.mazeSize,
            availableHeight / this.mazeSize
        );
    }

    private createMaze() {
        // Initialize maze grid
        this.maze = [];
        for (let y = 0; y < this.mazeSize; y++) {
            this.maze[y] = [];
            for (let x = 0; x < this.mazeSize; x++) {
                this.maze[y][x] = {
                    x,
                    y,
                    walls: { top: true, right: true, bottom: true, left: true },
                    visited: false
                };
            }
        }
        
        // Generate maze using depth-first search algorithm
        this.generateMazeUsingDFS();
        
        // Draw maze
        this.drawMaze();
    }

    private generateMazeUsingDFS() {
        const stack: MazeCell[] = [];
        // Start at a random cell
        const startX = Math.floor(Math.random() * this.mazeSize);
        const startY = Math.floor(Math.random() * this.mazeSize);
        let currentCell = this.maze[startY][startX];
        currentCell.visited = true;
        
        // Continue until all cells have been visited
        stack.push(currentCell);
        while (stack.length > 0) {
            currentCell = stack.pop()!;
            const neighbors = this.getUnvisitedNeighbors(currentCell);
            
            if (neighbors.length > 0) {
                stack.push(currentCell);
                
                // Choose a random neighbor
                const randomIndex = Math.floor(Math.random() * neighbors.length);
                const nextCell = neighbors[randomIndex];
                
                // Remove walls between current cell and chosen neighbor
                this.removeWallsBetween(currentCell, nextCell);
                
                nextCell.visited = true;
                stack.push(nextCell);
            }
        }
    }

    private getUnvisitedNeighbors(cell: MazeCell): MazeCell[] {
        const neighbors: MazeCell[] = [];
        const { x, y } = cell;
        
        // Check top neighbor
        if (y > 0 && !this.maze[y-1][x].visited) {
            neighbors.push(this.maze[y-1][x]);
        }
        
        // Check right neighbor
        if (x < this.mazeSize - 1 && !this.maze[y][x+1].visited) {
            neighbors.push(this.maze[y][x+1]);
        }
        
        // Check bottom neighbor
        if (y < this.mazeSize - 1 && !this.maze[y+1][x].visited) {
            neighbors.push(this.maze[y+1][x]);
        }
        
        // Check left neighbor
        if (x > 0 && !this.maze[y][x-1].visited) {
            neighbors.push(this.maze[y][x-1]);
        }
        
        return neighbors;
    }

    private removeWallsBetween(cell1: MazeCell, cell2: MazeCell) {
        const dx = cell2.x - cell1.x;
        const dy = cell2.y - cell1.y;
        
        if (dx === 1) { // cell2 is to the right of cell1
            cell1.walls.right = false;
            cell2.walls.left = false;
        } else if (dx === -1) { // cell2 is to the left of cell1
            cell1.walls.left = false;
            cell2.walls.right = false;
        } else if (dy === 1) { // cell2 is below cell1
            cell1.walls.bottom = false;
            cell2.walls.top = false;
        } else if (dy === -1) { // cell2 is above cell1
            cell1.walls.top = false;
            cell2.walls.bottom = false;
        }
    }

    private drawMaze() {
        // Clear existing graphics
        if (this.mazeGraphics) {
            this.mazeGraphics.clear();
        } else {
            this.mazeGraphics = this.add.graphics();
            this.mazeContainer.add(this.mazeGraphics);
        }
        
        // Calculate maze dimensions
        const mazeWidth = this.mazeSize * this.cellSize;
        const mazeHeight = this.mazeSize * this.cellSize;
        
        // Center the maze graphics within the container
        this.mazeGraphics.setPosition(-mazeWidth/2, -mazeHeight/2);
        
        // Resize and position the maze background image
        const mazeBgImage = this.mazeContainer.getAt(0) as Phaser.GameObjects.Image; // Assuming it's the first child added
        if (mazeBgImage && mazeBgImage.texture.key === 'maze-bg') {
            mazeBgImage.setDisplaySize(mazeWidth, mazeHeight);
            // Ensure it stays behind other maze elements visually, even though it was added first.
            // Alternative: this.mazeContainer.sendToBack(mazeBgImage);
        }
        
        // Draw the maze cells
        this.mazeGraphics.lineStyle(5, 0xffffff, 1);
        
        // Draw walls
        for (let y = 0; y < this.mazeSize; y++) {
            for (let x = 0; x < this.mazeSize; x++) {
                const cell = this.maze[y][x];
                const cellX = x * this.cellSize;
                const cellY = y * this.cellSize;
                
                // Draw top wall
                if (cell.walls.top) {
                    this.mazeGraphics.beginPath();
                    this.mazeGraphics.moveTo(cellX, cellY);
                    this.mazeGraphics.lineTo(cellX + this.cellSize, cellY);
                    this.mazeGraphics.strokePath();
                }
                
                // Draw right wall
                if (cell.walls.right) {
                    this.mazeGraphics.beginPath();
                    this.mazeGraphics.moveTo(cellX + this.cellSize, cellY);
                    this.mazeGraphics.lineTo(cellX + this.cellSize, cellY + this.cellSize);
                    this.mazeGraphics.strokePath();
                }
                
                // Draw bottom wall
                if (cell.walls.bottom) {
                    this.mazeGraphics.beginPath();
                    this.mazeGraphics.moveTo(cellX, cellY + this.cellSize);
                    this.mazeGraphics.lineTo(cellX + this.cellSize, cellY + this.cellSize);
                    this.mazeGraphics.strokePath();
                }
                
                // Draw left wall
                if (cell.walls.left) {
                    this.mazeGraphics.beginPath();
                    this.mazeGraphics.moveTo(cellX, cellY);
                    this.mazeGraphics.lineTo(cellX, cellY + this.cellSize);
                    this.mazeGraphics.strokePath();
                }
            }
        }
        
        // Create direction indicator
        this.createDirectionIndicator(mazeWidth, mazeHeight);
        
        // After maze is drawn, set up game objects
        this.placePenguinsAndFish();
    }

    private createDirectionIndicator(mazeWidth: number, mazeHeight: number) {
        // Remove existing indicator if it exists
        if (this.directionIndicator) {
            this.directionIndicator.destroy();
        }
        
        // Create a new container for the indicator
        // Position at the top edge of the maze (no gap)
        this.directionIndicator = this.add.container(0, -mazeHeight/2);
        this.mazeContainer.add(this.directionIndicator);
        
        // Create the semicircle background
        const radius = 40;
        const block = this.add.graphics();
        
        // Fill with dark gray
        block.fillStyle(0x333333, 1);
        
        // Draw semicircle (half circle)
        block.beginPath();
        block.arc(0, 0, radius, Math.PI, 0, false); // From 180° to 0° (semicircle facing up)
        block.fillPath();
        
        // Add white border
        block.lineStyle(2, 0xFFFFFF, 1);
        block.beginPath();
        block.arc(0, 0, radius, Math.PI, 0, false);
        block.lineTo(radius, 0); // Bottom right
        block.lineTo(-radius, 0); // Bottom left
        block.closePath();
        block.strokePath();
        
        this.directionIndicator.add(block);
        
        // Create the upward pointing arrow
        const arrow = this.add.graphics();
        arrow.fillStyle(0xFFFF00, 1); // Yellow arrow
        
        // Draw arrow pointing upward (centered in the semicircle)
        arrow.beginPath();
        arrow.moveTo(0, -radius/1.5); // Arrow tip (higher in the semicircle)
        arrow.lineTo(15, -radius/3); // Bottom right
        arrow.lineTo(-15, -radius/3); // Bottom left
        arrow.closePath();
        arrow.fill();
        
        this.directionIndicator.add(arrow);
        
        // Set the depth to ensure it appears above maze elements
        this.directionIndicator.setDepth(20);
    }

    private findFurthestCell(startCell: Position): Position {
        // Use BFS to find the furthest cell from the start position
        const queue: { cell: Position; distance: number }[] = [];
        const visited: boolean[][] = Array(this.mazeSize).fill(0).map(() => Array(this.mazeSize).fill(false));
        let furthestCell = startCell;
        let maxDistance = 0;

        queue.push({ cell: startCell, distance: 0 });
        visited[startCell.y][startCell.x] = true;

        while (queue.length > 0) {
            const current = queue.shift();
            if (!current) continue;
            
            const { cell, distance } = current;

            // If this is the furthest cell we've seen, update our tracking
            if (distance > maxDistance) {
                maxDistance = distance;
                furthestCell = cell;
            }

            // Check all possible directions
            const directions = [
                { dx: 0, dy: -1 }, // Up
                { dx: 1, dy: 0 },  // Right
                { dx: 0, dy: 1 },  // Down
                { dx: -1, dy: 0 }  // Left
            ];

            for (const dir of directions) {
                if (this.isValidMove(cell, dir.dx, dir.dy)) {
                    const nextX = cell.x + dir.dx;
                    const nextY = cell.y + dir.dy;

                    if (!visited[nextY][nextX]) {
                        visited[nextY][nextX] = true;
                        queue.push({
                            cell: { x: nextX, y: nextY },
                            distance: distance + 1
                        });
                    }
                }
            }
        }

        return furthestCell;
    }

    private placePenguinsAndFish() {
        // Calculate maze dimensions
        const mazeWidth = this.mazeSize * this.cellSize;
        const mazeHeight = this.mazeSize * this.cellSize;
        
        // Set both player and enemy starting position at top-left corner
        const startCell = { x: 0, y: 0 };
        
        // Find the furthest cell from the start position for the fish
        const fishCell = this.findFurthestCell(startCell);
        
        // Create or update player penguin
        if (!this.playerPenguin) {
            const playerSprite = this.add.sprite(
                -mazeWidth/2 + (startCell.x + 0.5) * this.cellSize,
                -mazeHeight/2 + (startCell.y + 0.5) * this.cellSize,
                'player'
            );
            playerSprite.setScale(this.cellSize / 48 * 1.2); // Increased scale from 0.8 to 1.2
            playerSprite.play('player-down');
            playerSprite.setDepth(10);
            playerSprite.setAngle(0); // Reset rotation
            
            this.playerPenguin = {
                sprite: playerSprite,
                cell: { x: startCell.x, y: startCell.y },
                previousPositions: [],
                color: 0x0000FF, // Keep color for reference
                direction: 'down'
            };
            
            this.mazeContainer.add(this.playerPenguin.sprite);
        } else {
            this.playerPenguin.cell = { x: startCell.x, y: startCell.y };
            this.playerPenguin.sprite.setPosition(
                -mazeWidth/2 + (startCell.x + 0.5) * this.cellSize,
                -mazeHeight/2 + (startCell.y + 0.5) * this.cellSize
            );
            this.playerPenguin.previousPositions = [];
            this.playerPenguin.direction = 'down';
            this.playerPenguin.sprite.play('player-down');
            this.playerPenguin.sprite.setScale(this.cellSize / 48 * 1.2); // Update scale here too
            this.playerPenguin.sprite.setAngle(0); // Reset rotation
        }
        
        // Create or update enemy penguin
        if (!this.enemyPenguin) {
            const enemySprite = this.add.sprite(
                -mazeWidth/2 + (startCell.x + 0.5) * this.cellSize,
                -mazeHeight/2 + (startCell.y + 0.5) * this.cellSize,
                'enemy'
            );
            enemySprite.setScale(this.cellSize / 48 * 1.2); // Increased scale from 0.8 to 1.2
            enemySprite.play('enemy-down');
            enemySprite.setDepth(10);
            enemySprite.setAngle(0); // Reset rotation
            
            this.enemyPenguin = {
                sprite: enemySprite,
                cell: { x: startCell.x, y: startCell.y },
                previousPositions: [],
                color: 0xFF0000, // Keep color for reference
                direction: 'down'
            };
            
            this.mazeContainer.add(this.enemyPenguin.sprite);
        } else {
            this.enemyPenguin.cell = { x: startCell.x, y: startCell.y };
            this.enemyPenguin.sprite.setPosition(
                -mazeWidth/2 + (startCell.x + 0.5) * this.cellSize,
                -mazeHeight/2 + (startCell.y + 0.5) * this.cellSize
            );
            this.enemyPenguin.previousPositions = [];
            this.enemyPenguin.direction = 'down';
            this.enemyPenguin.sprite.play('enemy-down');
            this.enemyPenguin.sprite.setScale(this.cellSize / 48 * 1.2); // Update scale here too
            this.enemyPenguin.sprite.setAngle(0); // Reset rotation
        }
        
        // Select a random fish image key (1-4)
        const fishNumber = Math.floor(Math.random() * 4) + 1;
        const fishKey = `fish-${fishNumber}`;
        
        // Create or update fish
        if (!this.fish) {
            this.fish = this.add.sprite(
                -mazeWidth/2 + (fishCell.x + 0.5) * this.cellSize,
                -mazeHeight/2 + (fishCell.y + 0.5) * this.cellSize,
                fishKey
            );
            this.fish.setScale(this.cellSize / 64 * 0.34); // Assuming fish is around 64px, scale to fit cell
            this.fish.setDepth(5);
            this.fish.setAngle(0); // Reset rotation
            this.mazeContainer.add(this.fish);
        } else {
            this.fish.setPosition(
                -mazeWidth/2 + (fishCell.x + 0.5) * this.cellSize,
                -mazeHeight/2 + (fishCell.y + 0.5) * this.cellSize
            );
            this.fish.setTexture(fishKey); // Change the fish texture
            this.fish.setAngle(0); // Reset rotation
        }
        this.fish.setVisible(true); // Ensure fish is visible for the new round
    }

    private setupGameObjects() {
        // Nothing to setup now that direction indicator is removed
    }

    private createUI() {
        // Create header container
        this.uiHeader = this.add.container(0, 0);
        this.uiHeader.setDepth(100); // Set depth for the entire header block

        // Create header background
        const headerBg = this.add.graphics();
        headerBg.fillStyle(0x222222, 0.8); // Dark semi-transparent background
        headerBg.fillRect(0, 0, this.cameras.main.width, 60); // Header height of 60px
        this.uiHeader.add(headerBg); // Added first, will be at the bottom within uiHeader

        // Calculate UI positions for horizontal layout
        const padding = 20;
        const headerHeight = 60;
        const verticalCenterY = headerHeight / 2;
        const screenWidth = this.cameras.main.width;

        // Score text - positioned on the left side
        this.scoreText = this.add.text(
            padding, // X position from left edge
            verticalCenterY, // Y position, vertically centered in header
            `SCORE: ${this.score}`,
            {
                fontFamily: 'Arial',
                fontSize: '22px',
                color: '#ffffff'
            }
        );
        this.scoreText.setOrigin(0, 0.5); // Left aligned, vertically centered
        this.uiHeader.add(this.scoreText); // Add to uiHeader directly

        // Trial text - positioned in the center
        this.trialText = this.add.text(
            screenWidth / 2, // X position (center of screen)
            verticalCenterY, // Y position, vertically centered in header
            `TRIAL: ${this.currentTrial}/${this.totalTrials}`,
            {
                fontFamily: 'Arial',
                fontSize: '22px',
                color: '#ffffff'
            }
        );
        this.trialText.setOrigin(0.5, 0.5); // Center aligned, vertically centered
        this.uiHeader.add(this.trialText); // Add to uiHeader directly

        // Create difficulty button and position it on the right side
        this.createDifficultyButton(this.uiHeader); // Pass uiHeader as parent
        
        // Position the difficulty button
        // Button width is 100 (from its internal graphics at -50 to +50), so its center is its origin (0,0)
        const buttonWidth = 100; 
        this.difficultyButton.setPosition(
            screenWidth - padding - (buttonWidth / 2), // Position center of button from right edge
            verticalCenterY // Vertically centered in header
        );
        // Note: difficultyButton.setDepth() is removed as uiHeader handles depth

        // Result text (initially hidden) - unchanged positioning relative to screen center
        this.resultText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            '',
            {
                fontFamily: 'Arial',
                fontSize: '48px',
                color: '#ffffff',
                backgroundColor: '#000000',
                padding: { x: 20, y: 10 }
            }
        );
        this.resultText.setOrigin(0.5);
        this.resultText.setDepth(200);
        this.resultText.setVisible(false);
    }
    
    // Create difficulty button with position parameters
    private createDifficultyButton(parent: Phaser.GameObjects.Container) {
        this.difficultyButton = this.add.container();
        parent.add(this.difficultyButton);
        
        // Button background
        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(0x444444, 1);
        buttonBg.fillRoundedRect(-50, -15, 100, 30, 8);
        buttonBg.lineStyle(2, 0xffffff, 1);
        buttonBg.strokeRoundedRect(-50, -15, 100, 30, 8);
        this.difficultyButton.add(buttonBg);
        
        // Button text
        const buttonText = this.add.text(0, 0, this.difficulty === 'normal' ? 'NORMAL' : 'HARD', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff'
        });
        buttonText.setOrigin(0.5);
        this.difficultyButton.add(buttonText);
        
        // Make button interactive
        this.difficultyButton.setInteractive(new Phaser.Geom.Rectangle(-50, -15, 100, 30), Phaser.Geom.Rectangle.Contains);
        
        // Add click handler
        this.difficultyButton.on('pointerdown', () => {
            // Toggle difficulty
            this.difficulty = this.difficulty === 'normal' ? 'hard' : 'normal';
            
            // Update button text
            buttonText.setText(this.difficulty === 'normal' ? 'NORMAL' : 'HARD');
        });
        
        // Add hover effects
        this.difficultyButton.on('pointerover', () => {
            buttonBg.clear();
            buttonBg.fillStyle(0x666666, 1); // Lighter color on hover
            buttonBg.fillRoundedRect(-50, -15, 100, 30, 8);
            buttonBg.lineStyle(2, 0xffffff, 1);
            buttonBg.strokeRoundedRect(-50, -15, 100, 30, 8);
        });
        
        this.difficultyButton.on('pointerout', () => {
            buttonBg.clear();
            buttonBg.fillStyle(0x444444, 1); // Back to normal color
            buttonBg.fillRoundedRect(-50, -15, 100, 30, 8);
            buttonBg.lineStyle(2, 0xffffff, 1);
            buttonBg.strokeRoundedRect(-50, -15, 100, 30, 8);
        });
    }

    private setupInput() {
        // Set up keyboard input
        if (this.input && this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        }
    }

    private handlePlayerInput() {
        if (this.playerMoving) return;
        
        let dx = 0;
        let dy = 0;
        let direction: 'up' | 'right' | 'down' | 'left' = this.playerPenguin.direction;
        
        // Simple directional movement without rotation
        if (this.cursors.up.isDown) {
            dy = -1; // Up
            direction = 'up';
        } else if (this.cursors.right.isDown) {
            dx = 1;  // Right
            direction = 'right';
        } else if (this.cursors.down.isDown) {
            dy = 1;  // Down
            direction = 'down';
        } else if (this.cursors.left.isDown) {
            dx = -1; // Left
            direction = 'left';
        } else {
            return; // No key pressed
        }
        
        // Update animation based on direction
        this.playerPenguin.sprite.play(`player-${direction}`, true);
        this.playerPenguin.direction = direction;
        
        // Check if movement is valid (no wall in the way)
        if (this.isValidMove(this.playerPenguin.cell, dx, dy)) {
            // Move player
            this.movePlayer(dx, dy);
        }
    }

    private isValidMove(cell: Position, dx: number, dy: number): boolean {
        // Calculate target cell
        const targetX = cell.x + dx;
        const targetY = cell.y + dy;
        
        // Check if target is outside the maze
        if (targetX < 0 || targetX >= this.mazeSize || targetY < 0 || targetY >= this.mazeSize) {
            return false;
        }
        
        // Check if there's a wall between current cell and target cell
        if (dx === 1) { // Moving right
            return !this.maze[cell.y][cell.x].walls.right;
        } else if (dx === -1) { // Moving left
            return !this.maze[cell.y][cell.x].walls.left;
        } else if (dy === 1) { // Moving down
            return !this.maze[cell.y][cell.x].walls.bottom;
        } else if (dy === -1) { // Moving up
            return !this.maze[cell.y][cell.x].walls.top;
        }
        
        return false;
    }

    private movePlayer(dx: number, dy: number) {
        // Calculate maze dimensions
        const mazeWidth = this.mazeSize * this.cellSize;
        const mazeHeight = this.mazeSize * this.cellSize;
        
        // Save current position for path tracking
        this.playerPenguin.previousPositions.push({ ...this.playerPenguin.cell });
        
        // Update player cell
        this.playerPenguin.cell.x += dx;
        this.playerPenguin.cell.y += dy;
        
        // Calculate target position relative to container
        const targetX = -mazeWidth/2 + (this.playerPenguin.cell.x + 0.5) * this.cellSize;
        const targetY = -mazeHeight/2 + (this.playerPenguin.cell.y + 0.5) * this.cellSize;
        
        // Animate player movement
        this.playerMoving = true;
        this.tweens.add({
            targets: this.playerPenguin.sprite,
            x: targetX,
            y: targetY,
            duration: 150,
            ease: 'Linear',
            onComplete: () => {
                this.playerMoving = false;
                
                // Check if player reached the fish using sprite collision
                if (this.checkPenguinFishCollision(this.playerPenguin.sprite)) {
                    this.fish.setVisible(false);
                    this.playerWins();
                }
            }
        });
    }

    private getCellFromPosition(x: number, y: number): Position {
        // Calculate maze dimensions
        const mazeWidth = this.mazeSize * this.cellSize;
        const mazeHeight = this.mazeSize * this.cellSize;
        
        // Convert position to cell coordinates relative to container
        const cellX = Math.floor((x + mazeWidth/2) / this.cellSize);
        const cellY = Math.floor((y + mazeHeight/2) / this.cellSize);
        
        return { x: cellX, y: cellY };
    }

    private moveEnemyPenguin() {
        // Simple AI for enemy: uses breadth-first search to find path to fish
        const pathToFish = this.findPathToFish(this.enemyPenguin.cell);
        
        if (pathToFish.length > 1) {
            // Get next step (index 1 as index 0 is the current position)
            const nextStep = pathToFish[1];
            
            // Calculate direction
            const dx = nextStep.x - this.enemyPenguin.cell.x;
            const dy = nextStep.y - this.enemyPenguin.cell.y;
            
            // Determine animation direction
            let direction: 'up' | 'right' | 'down' | 'left' = this.enemyPenguin.direction;
            
            if (dx === 1) {
                direction = 'right';
            } else if (dx === -1) {
                direction = 'left';
            } else if (dy === 1) {
                direction = 'down';
            } else if (dy === -1) {
                direction = 'up';
            }
            
            // Update animation
            this.enemyPenguin.sprite.play(`enemy-${direction}`, true);
            this.enemyPenguin.direction = direction;
            
            // Save current position for path tracking
            this.enemyPenguin.previousPositions.push({ ...this.enemyPenguin.cell });
            
            // Update enemy cell
            this.enemyPenguin.cell.x = nextStep.x;
            this.enemyPenguin.cell.y = nextStep.y;
            
            // Calculate maze dimensions
            const mazeWidth = this.mazeSize * this.cellSize;
            const mazeHeight = this.mazeSize * this.cellSize;
            
            // Calculate target position relative to container
            const targetX = -mazeWidth/2 + (nextStep.x + 0.5) * this.cellSize;
            const targetY = -mazeHeight/2 + (nextStep.y + 0.5) * this.cellSize;
            
            // Determine enemy speed based on difficulty
            const baseSpeed = this.difficulty === 'normal' ? 400 : 300; // Lower value = faster movement
            const moveDuration = baseSpeed - (this.currentTrial * 15); // Speed increases with trials
            
            // Animate enemy movement
            this.enemyMoving = true;
            this.tweens.add({
                targets: this.enemyPenguin.sprite,
                x: targetX,
                y: targetY,
                duration: Math.max(moveDuration, 150), // Ensure minimum speed
                ease: 'Linear',
                onComplete: () => {
                    this.enemyMoving = false;
                    
                    // Check if enemy reached the fish using sprite collision
                    if (this.checkPenguinFishCollision(this.enemyPenguin.sprite)) {
                        this.fish.setVisible(false);
                        this.enemyWins();
                    }
                }
            });
        }
    }

    private findPathToFish(startCell: Position): Position[] {
        // Get fish cell
        const fishCell = this.getCellFromPosition(this.fish.x, this.fish.y);
        
        // BFS implementation
        const queue: { cell: Position; path: Position[] }[] = [];
        const visited: boolean[][] = Array(this.mazeSize).fill(0).map(() => Array(this.mazeSize).fill(false));
        
        // Add start cell to queue
        queue.push({ cell: startCell, path: [startCell] });
        visited[startCell.y][startCell.x] = true;
        
        while (queue.length > 0) {
            const currentItem = queue.shift();
            // Add null check to fix the error
            if (!currentItem) continue;
            
            const { cell, path } = currentItem;
            
            // Check if we've reached the target
            if (cell.x === fishCell.x && cell.y === fishCell.y) {
                return path;
            }
            
            // Try all four directions
            const directions = [
                { dx: 0, dy: -1 }, // Up
                { dx: 1, dy: 0 },  // Right
                { dx: 0, dy: 1 },  // Down
                { dx: -1, dy: 0 }  // Left
            ];
            
            for (const dir of directions) {
                if (this.isValidMove(cell, dir.dx, dir.dy)) {
                    const nextX = cell.x + dir.dx;
                    const nextY = cell.y + dir.dy;
                    
                    if (!visited[nextY][nextX]) {
                        visited[nextY][nextX] = true;
                        const nextCell = { x: nextX, y: nextY };
                        queue.push({
                            cell: nextCell,
                            path: [...path, nextCell]
                        });
                    }
                }
            }
        }
        
        // No path found
        return [startCell];
    }

    private playerWins() {
        this.isRoundComplete = true;
        
        // Calculate score based on difficulty
        const playerDistance = this.playerPenguin.previousPositions.length;
        const enemyDistance = this.enemyPenguin.previousPositions.length;
        const difficultyMultiplier = this.difficulty === 'normal' ? 10 : 20;
        const points = Math.max(10, (playerDistance - enemyDistance) * 2 * difficultyMultiplier);
        
        this.score += points;
        this.scoreText.setText(`SCORE: ${this.score}`);
        
        // Show win message
        this.resultText.setText(`YOU WIN! +${points} POINTS`);
        this.resultText.setBackgroundColor('#008800');
        this.resultText.setVisible(true);
        
        // Wait a moment before next trial
        this.time.delayedCall(2000, () => {
            this.startNextTrial();
        });
    }

    private enemyWins() {
        this.isRoundComplete = true;
        
        // Calculate score penalty based on difficulty
        const playerDistance = this.playerPenguin.previousPositions.length;
        const enemyDistance = this.enemyPenguin.previousPositions.length;
        const difficultyMultiplier = this.difficulty === 'normal' ? 5 : 10;
        const points = Math.min(-10, (playerDistance - enemyDistance) * difficultyMultiplier);
        
        // Add points (will be negative)
        this.score += points;
        this.scoreText.setText(`SCORE: ${this.score}`);
        
        // Show lose message
        let message = `PENGUIN BEAT YOU TO THE FISH!`;
        if (points !== 0) {
            message += ` ${points} POINTS`;
        }
        
        this.resultText.setText(message);
        this.resultText.setBackgroundColor('#880000');
        this.resultText.setVisible(true);
        
        // Wait a moment before next trial
        this.time.delayedCall(2000, () => {
            this.startNextTrial();
        });
    }

    private startNextTrial() {
        this.resultText.setVisible(false);
        
        // Increment trial counter
        this.currentTrial++;
        
        if (this.currentTrial <= this.totalTrials) {
            // Update trial text
            this.trialText.setText(`TRIAL: ${this.currentTrial}/${this.totalTrials}`);
            
            // Reset maze rotation
            this.mazeContainer.setAngle(0);
            
            // Reset sprite rotations if they exist
            if (this.playerPenguin && this.playerPenguin.sprite) {
                this.playerPenguin.sprite.setAngle(0);
            }
            if (this.enemyPenguin && this.enemyPenguin.sprite) {
                this.enemyPenguin.sprite.setAngle(0);
            }
            if (this.fish) {
                this.fish.setAngle(0);
            }
            if (this.directionIndicator) {
                this.directionIndicator.setAngle(0);
            }
            
            // Reset and create new maze
            this.initializeLevel();
            this.createMaze();
            
            // Create and start countdown
            this.createCountdown();
        } else {
            // End of all trials
            this.gameOver();
        }
    }

    private checkWinLoseConditions() {
        // Already handled by the reach-fish checks in move functions
    }

    private gameOver() {
        this.isGameOver = true;
        
        // Show game over message
        this.resultText.setText(`GAME OVER\nFINAL SCORE: ${this.score}`);
        this.resultText.setBackgroundColor('#000088');
        this.resultText.setVisible(true);
        
        // Return to main menu after delay
        this.time.delayedCall(3000, () => {
            this.scene.start('MainMenu');
        });
    }

    private setupMazeRotation() {
        // Clear existing timer if it exists
        if (this.mazeRotationTimer) {
            this.mazeRotationTimer.destroy();
        }

        // Create new timer that triggers every 4 seconds
        this.mazeRotationTimer = this.time.addEvent({
            delay: 4000,
            callback: this.rotateMaze,
            callbackScope: this,
            loop: true
        });
    }

    private rotateMaze = () => {
        if (this.isCountdownActive || this.isRoundComplete || this.isGameOver) return;

        // Rotate maze by 90 degrees
        this.tweens.add({
            targets: this.mazeContainer,
            angle: this.mazeContainer.angle + 90,
            duration: 1000,
            ease: 'Cubic.easeInOut'
        });

        // Counter-rotate the player, enemy, and fish sprites (but not the direction indicator)
        this.tweens.add({
            targets: [this.playerPenguin.sprite, this.enemyPenguin.sprite, this.fish],
            angle: '-=90', // Rotate in the opposite direction
            duration: 1000,
            ease: 'Cubic.easeInOut'
        });
    }

    private checkPenguinFishCollision(penguinSprite: Phaser.GameObjects.Sprite): boolean {
        if (!this.fish || !this.fish.visible) return false;

        const distance = Phaser.Math.Distance.Between(
            penguinSprite.x, penguinSprite.y,
            this.fish.x, this.fish.y
        );

        // Consider a catch if the penguin's center is within the fish's radius
        const fishRadius = this.fish.displayWidth / 2;

        return distance < fishRadius;
    }
} 