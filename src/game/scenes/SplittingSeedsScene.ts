import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class SplittingSeedsScene extends Scene {
    // Game objects
    private stick: Phaser.GameObjects.Rectangle;
    private seeds: Phaser.GameObjects.Image[] = [];
    private birds: Phaser.GameObjects.Rectangle[] = [];
    
    // Game state
    private score: number = 0;
    private level: number = 1;
    private maxLevel: number = 10;
    private levelDots: Phaser.GameObjects.Arc[] = [];
    private timeLeft: number = 60; // 60 seconds game time
    private gameTimer: Phaser.Time.TimerEvent;
    private isStickRotating: boolean = false;
    private isRoundComplete: boolean = false;
    private seedCount: number = 0;
    private leftSeedCount: number = 0;
    private rightSeedCount: number = 0;
    
    // UI elements
    private scoreText: Phaser.GameObjects.Text;
    private levelText: Phaser.GameObjects.Text;
    private timeText: Phaser.GameObjects.Text;
    private resultText: Phaser.GameObjects.Text;
    private leftCountText: Phaser.GameObjects.Text;
    private rightCountText: Phaser.GameObjects.Text;
    private pauseButton: Phaser.GameObjects.Rectangle;
    private resultSymbol: Phaser.GameObjects.Text;
    private resultBackground: Phaser.GameObjects.Rectangle;
    
    // Add these properties to the class
    private stickLineSegment: {x1: number, y1: number, x2: number, y2: number} = {x1: 0, y1: 0, x2: 0, y2: 0};
    private seedOriginalPositions: Map<Phaser.GameObjects.Image, {x: number, y: number}> = new Map();
    private seedAnimating: Map<Phaser.GameObjects.Image, boolean> = new Map();
    private stickAnglePrev: number = 0;
    
    // Add these color constants to the top of the class
    private readonly LEFT_SIDE_COLOR: number = 0x8AECFF; // Light blue for left side
    private readonly RIGHT_SIDE_COLOR: number = 0xFFB6C1; // Light pink for right side
    private readonly SEED_BASE_COLOR: number = 0xFFD700; // Original yellow color
    
    // Asset keys
    private readonly SEED_KEY: string = 'splitting-seed';
    private readonly BACKGROUND_KEY: string = 'splitting-background';
    
    constructor() {
        super('SplittingSeedsScene');
    }
    
    preload() {
        // Load game assets
        this.load.image(this.SEED_KEY, 'assets/SplittingSeeds/seed.png');
        this.load.image(this.BACKGROUND_KEY, 'assets/SplittingSeeds/background.png');
    }
    
    create() {
        // Set background
        this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, this.BACKGROUND_KEY)
            .setDisplaySize(this.cameras.main.width, this.cameras.main.height);
        
        // Create placeholder birds (left and right)
        this.createBirds();
        
        // Create central wooden stick
        this.createStick();
        
        // Initialize UI elements
        this.createUI();
        
        // Setup input handling
        this.setupInput();
        
        // Start the game timer
        this.startGameTimer();
        
        // Start first round
        this.startNewRound();
        
        // Emit event that scene is ready
        EventBus.emit('current-scene-ready', this);
    }
    
    update(time: number, delta: number) {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        
        if (this.isStickRotating) {
            // Update stick rotation based on mouse/touch position
            // This will now follow the cursor continuously, allowing for full 360-degree rotation
            const newAngle = Phaser.Math.Angle.Between(centerX, centerY, this.input.activePointer.x, this.input.activePointer.y);
            
            // Calculate the angle change
            const angleDelta = Phaser.Math.Angle.Wrap(newAngle - this.stickAnglePrev);
            
            // Update stick rotation
            this.stick.rotation = newAngle;
            
            // Update the stick line segment for collision detection
            const stickLength = 300; // Half the stick length
            this.stickLineSegment = {
                x1: centerX - Math.cos(newAngle) * stickLength,
                y1: centerY - Math.sin(newAngle) * stickLength,
                x2: centerX + Math.cos(newAngle) * stickLength,
                y2: centerY + Math.sin(newAngle) * stickLength
            };
            
            // Check for collisions with seeds
            this.checkSeedCollisions(angleDelta);
            
            // Update color coding for seeds based on which side they're on
            this.updateSeedSides();
            
            // Remember the current angle for next frame
            this.stickAnglePrev = newAngle;
        }
        
        // Update seed animations
        this.updateSeedAnimations(delta);
    }
    
    private createBirds() {
        // Left bird placeholder
        const leftBird = this.add.rectangle(100, this.cameras.main.height / 2, 60, 60, 0xA67C52);
        leftBird.setDepth(10);
        this.birds.push(leftBird);
        
        // Right bird placeholder
        const rightBird = this.add.rectangle(this.cameras.main.width - 100, this.cameras.main.height / 2, 60, 60, 0xA67C52);
        rightBird.setDepth(10);
        this.birds.push(rightBird);
    }
    
    private createStick() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        
        // Create stick as a rectangle at the center - increased length from 400 to 600
        this.stick = this.add.rectangle(centerX, centerY, 600, 20, 0x8B4513);
        this.stick.setOrigin(0.5);
        this.stick.setDepth(1); // Lower depth so seeds appear above the stick
        
        // Set initial random rotation - now full 360 degrees
        const initialAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        this.stick.rotation = initialAngle;
        this.stickAnglePrev = initialAngle;
        
        // Initialize stick line segment
        const stickLength = 300; // Half the stick length
        this.stickLineSegment = {
            x1: centerX - Math.cos(initialAngle) * stickLength,
            y1: centerY - Math.sin(initialAngle) * stickLength,
            x2: centerX + Math.cos(initialAngle) * stickLength,
            y2: centerY + Math.sin(initialAngle) * stickLength
        };
        
        // Enable stick rotation
        this.isStickRotating = true;
    }
    
    private createUI() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Score text
        this.scoreText = this.add.text(20, 20, 'SCORE: 0', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff'
        });
        this.scoreText.setDepth(100);
        
        // Level text
        this.levelText = this.add.text(width - 150, 20, 'LEVEL: 1', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff'
        });
        this.levelText.setDepth(100);
        
        // Time text
        this.timeText = this.add.text(width / 2, 20, 'TIME: 60', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff'
        });
        this.timeText.setOrigin(0.5, 0);
        this.timeText.setDepth(100);
        
        // Create level progress dots
        this.createLevelDots();
        
        // Result text (initially hidden)
        this.resultText = this.add.text(width / 2, height / 2 + 150, '', {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#ffffff'
        });
        this.resultText.setOrigin(0.5);
        this.resultText.setDepth(100);
        this.resultText.setVisible(false);
        
        // Add a background for result text (initially hidden)
        this.resultBackground = this.add.rectangle(width / 2, height / 2 + 150, 300, 120, 0x000000, 0.7);
        this.resultBackground.setOrigin(0.5);
        this.resultBackground.setDepth(99); // Below the text
        this.resultBackground.setVisible(false);
        
        // Seed count texts (initially hidden)
        this.leftCountText = this.add.text(width / 4, height / 2, '', {
            fontFamily: 'Arial',
            fontSize: '48px',
            color: '#ffffff'
        });
        this.leftCountText.setOrigin(0.5);
        this.leftCountText.setDepth(100);
        this.leftCountText.setVisible(false);
        
        this.rightCountText = this.add.text(width * 3/4, height / 2, '', {
            fontFamily: 'Arial',
            fontSize: '48px',
            color: '#ffffff'
        });
        this.rightCountText.setOrigin(0.5);
        this.rightCountText.setDepth(100);
        this.rightCountText.setVisible(false);
        
        // Result symbol (check or X) - initially hidden
        this.resultSymbol = this.add.text(width / 2, height / 2, '', {
            fontFamily: 'Arial',
            fontSize: '120px',
            color: '#ff0000'
        });
        this.resultSymbol.setOrigin(0.5);
        this.resultSymbol.setDepth(100);
        this.resultSymbol.setVisible(false);
        
        // Pause button
        this.pauseButton = this.add.rectangle(width - 40, 40, 30, 30, 0x000000);
        this.pauseButton.setInteractive();
        this.pauseButton.setDepth(100);
        this.pauseButton.on('pointerdown', () => {
            this.scene.pause();
            // Would typically show a pause menu here
        });
    }
    
    private createLevelDots() {
        const dotSpacing = 30;
        const dotSize = 15;
        const startX = this.cameras.main.width - 200;
        const y = 60;
        
        for (let i = 0; i < 4; i++) {
            const dot = this.add.circle(startX + (i * dotSpacing), y, dotSize / 2, 0xffffff);
            dot.setStrokeStyle(2, 0x000000);
            dot.setDepth(100);
            this.levelDots.push(dot);
        }
    }
    
    private setupInput() {
        // Click/touch to confirm stick position
        this.input.on('pointerdown', () => {
            if (this.isStickRotating && !this.isRoundComplete) {
                this.confirmStickPosition();
            } else if (this.isRoundComplete) {
                this.startNewRound();
            }
        });
    }
    
    private startGameTimer() {
        this.gameTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.timeLeft--;
                this.timeText.setText(`TIME: ${this.timeLeft}`);
                
                if (this.timeLeft <= 0) {
                    this.endGame();
                }
            },
            callbackScope: this,
            loop: true
        });
    }
    
    private startNewRound() {
        // Clear previous state
        this.clearRound();
        
        // Hide result elements
        this.resultText.setVisible(false);
        this.leftCountText.setVisible(false);
        this.rightCountText.setVisible(false);
        this.resultSymbol.setVisible(false);
        this.resultBackground.setVisible(false);
        
        // Enable stick rotation
        this.isStickRotating = true;
        this.isRoundComplete = false;
        
        // Set random rotation for stick
        this.stick.rotation = Phaser.Math.FloatBetween(0, Math.PI * 2);
        
        // Determine seed count based on level
        this.seedCount = Phaser.Math.Between(8 + (this.level * 2), 16 + (this.level * 2));
        
        // Always ensure an even number of seeds for fair distribution possibility
        if (this.seedCount % 2 !== 0) {
            this.seedCount++;
        }
        
        // Generate random seeds
        this.createRandomSeeds(this.seedCount);
    }
    
    private clearRound() {
        // Remove all existing seeds
        this.seeds.forEach(seed => seed.destroy());
        this.seeds = [];
    }
    
    private createRandomSeeds(count: number) {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        
        // The radius of the area where seeds can appear - slightly smaller than stick length/2
        const circleRadius = 280; // Stick length is 600, so radius is 300, but keep seeds slightly inside
        
        // Minimum distance from center to prevent seeds from being too close to the center
        const minDistanceFromCenter = 50;
        
        // Minimum distance between seeds to prevent overlap
        const minDistanceBetweenSeeds = 40; // Slightly larger than seed diameter
        
        // Array to store seed positions for collision checking
        const seedPositions: {x: number, y: number}[] = [];
        
        // Try to place each seed
        let attempts = 0;
        let i = 0;
        
        while (i < count && attempts < 1000) { // Limit attempts to avoid infinite loop
            // Generate random angle and distance from center
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const distance = Phaser.Math.FloatBetween(minDistanceFromCenter, circleRadius);
            
            // Calculate position using polar coordinates
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            
            // Check if this position overlaps with any existing seed
            let overlapping = false;
            for (const pos of seedPositions) {
                const dx = x - pos.x;
                const dy = y - pos.y;
                const distSquared = dx * dx + dy * dy;
                
                if (distSquared < minDistanceBetweenSeeds * minDistanceBetweenSeeds) {
                    overlapping = true;
                    break;
                }
            }
            
            attempts++;
            
            // If not overlapping with any existing seed, place the seed
            if (!overlapping) {
                // Create seed using the seed image
                const seed = this.add.image(x, y, this.SEED_KEY);
                seed.setScale(0.075); // Smaller scale for seed sprites
                seed.setDepth(5); // Higher depth so seeds appear above the stick
                
                this.seeds.push(seed);
                seedPositions.push({x, y});
                i++;
            }
        }
        
        // If we couldn't place all seeds due to space constraints, adjust the count
        if (i < count) {
            this.seedCount = i;
            console.log(`Could only place ${i} seeds out of ${count} requested due to space constraints`);
        }
        
        // Store original positions for animation and initialize initial sides
        for (const seed of this.seeds) {
            this.seedOriginalPositions.set(seed, {x: seed.x, y: seed.y});
            this.seedAnimating.set(seed, false);
        }
        
        // Set initial color coding for sides
        this.updateSeedSides();
    }
    
    private confirmStickPosition() {
        this.isStickRotating = false;
        this.isRoundComplete = true;
        
        // Count seeds on each side of the stick
        this.countSeedsOnBothSides();
        
        // Show seed counts
        this.leftCountText.setText(`${this.leftSeedCount}`);
        this.leftCountText.setVisible(true);
        
        this.rightCountText.setText(`${this.rightSeedCount}`);
        this.rightCountText.setVisible(true);
        
        // Determine if the split was correct
        if (this.leftSeedCount === this.rightSeedCount) {
            this.handleCorrectSplit();
        } else {
            this.handleIncorrectSplit();
        }
        
        // Set a timer to start a new round
        this.time.delayedCall(2000, () => {
            if (this.timeLeft > 0) {
                this.startNewRound();
            }
        });
    }
    
    private countSeedsOnBothSides() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        
        // Reset counts
        this.leftSeedCount = 0;
        this.rightSeedCount = 0;
        
        // Get stick angle
        const stickAngle = this.stick.rotation;
        
        // Calculate normal to the stick (perpendicular direction)
        const normalAngle = stickAngle + Math.PI / 2;
        const normalX = Math.cos(normalAngle);
        const normalY = Math.sin(normalAngle);
        
        this.seeds.forEach(seed => {
            // Vector from center to seed
            const dx = seed.x - centerX;
            const dy = seed.y - centerY;
            
            // Dot product with normal
            const dotProduct = dx * normalX + dy * normalY;
            
            if (dotProduct > 0) {
                this.leftSeedCount++;
                // Highlight left side seeds (visual indication)
                seed.setTint(0x00FF00);
            } else {
                this.rightSeedCount++;
                // Highlight right side seeds (visual indication)
                seed.setTint(0x0000FF);
            }
        });
    }
    
    private handleCorrectSplit() {
        // Show success indicator
        this.resultSymbol.setText('✓');
        this.resultSymbol.setColor('#7CFC00'); // Light green - softer color
        this.resultSymbol.setVisible(true);
        
        // Update score
        const pointsEarned = 200 * this.level;
        this.score += pointsEarned;
        this.scoreText.setText(`SCORE: ${this.score}`);
        
        // Update level progress
        this.updateLevelProgress(true);
        
        // Show success message with background
        this.resultText.setText(`Correct! +${pointsEarned} points`);
        this.resultText.setColor('#C1FFC1'); // Pale green - softer color
        this.resultText.setVisible(true);
        
        // Show background
        this.resultBackground.setVisible(true);
        this.resultBackground.width = this.resultText.width + 40;
        
        // Use specific colors for verification
        this.seeds.forEach(seed => {
            // Keep final colors for seed sides
        });
    }
    
    private handleIncorrectSplit() {
        // Show failure indicator
        this.resultSymbol.setText('X');
        this.resultSymbol.setColor('#FFB6C1'); // Light pink - softer color
        this.resultSymbol.setVisible(true);
        
        // Calculate difference
        const difference = Math.abs(this.leftSeedCount - this.rightSeedCount);
        const dotsLost = Math.min(4, Math.floor(difference / 2));
        
        // Update level progress negatively
        this.updateLevelProgress(false, dotsLost);
        
        // Show failure message with background
        this.resultText.setText(`Wrong! Difference: ${difference}`);
        this.resultText.setColor('#FFB6C1'); // Light pink - softer color
        this.resultText.setVisible(true);
        
        // Show background
        this.resultBackground.setVisible(true);
        this.resultBackground.width = this.resultText.width + 40;
        
        // Use specific colors for verification
        this.seeds.forEach(seed => {
            // Keep final colors for seed sides
        });
    }
    
    private updateLevelProgress(correct: boolean, dotsLost: number = 0) {
        if (correct) {
            // Fill the next progress dot
            let filledDots = 0;
            for (let i = 0; i < this.levelDots.length; i++) {
                if (this.levelDots[i].fillColor === 0xffffff) {
                    this.levelDots[i].fillColor = 0x00ff00;
                    filledDots = i + 1;
                    break;
                }
            }
            
            // If all dots are filled, level up
            if (filledDots === 4) {
                this.levelUp();
            }
        } else {
            // Remove progress dots based on dotsLost
            let unfilledCount = 0;
            for (let i = this.levelDots.length - 1; i >= 0; i--) {
                if (this.levelDots[i].fillColor !== 0xffffff && unfilledCount < dotsLost) {
                    this.levelDots[i].fillColor = 0xffffff;
                    unfilledCount++;
                }
            }
            
            // If we need to remove more dots than we had filled, go down a level
            if (unfilledCount < dotsLost && this.level > 1) {
                this.levelDown();
            }
        }
    }
    
    private levelUp() {
        if (this.level < this.maxLevel) {
            this.level++;
            this.levelText.setText(`LEVEL: ${this.level}`);
            
            // Reset progress dots
            this.levelDots.forEach(dot => dot.fillColor = 0xffffff);
        }
    }
    
    private levelDown() {
        this.level--;
        this.levelText.setText(`LEVEL: ${this.level}`);
        
        // Reset progress dots
        this.levelDots.forEach(dot => dot.fillColor = 0xffffff);
    }
    
    private endGame() {
        // Stop the timer
        this.gameTimer.remove();
        
        // Calculate end-of-game bonus
        const bonus = 1000 * this.level;
        this.score += bonus;
        
        // Show game over text
        const gameOverText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 100,
            'GAME OVER',
            {
                fontFamily: 'Arial',
                fontSize: '64px',
                color: '#ffffff'
            }
        );
        gameOverText.setOrigin(0.5);
        gameOverText.setDepth(100);
        
        // Show final score with bonus
        const finalScoreText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            `Final Score: ${this.score}\nLevel Bonus: ${bonus}`,
            {
                fontFamily: 'Arial',
                fontSize: '32px',
                color: '#ffffff',
                align: 'center'
            }
        );
        finalScoreText.setOrigin(0.5);
        finalScoreText.setDepth(100);
    }
    
    private checkSeedCollisions(angleDelta: number) {
        if (Math.abs(angleDelta) < 0.001) return; // Skip if rotation is very small
        
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        const seedRadius = 15; // Seed radius
        
        for (const seed of this.seeds) {
            // Skip seeds already animating
            if (this.seedAnimating.get(seed)) continue;
            
            // Check if this seed intersects with the stick
            const distance = this.distanceFromPointToLine(
                seed.x, seed.y,
                this.stickLineSegment.x1, this.stickLineSegment.y1,
                this.stickLineSegment.x2, this.stickLineSegment.y2
            );
            
            if (distance < seedRadius) {
                // Determine which side the seed will move to
                const angle = Math.atan2(seed.y - centerY, seed.x - centerX);
                const normalAngle = this.stick.rotation + Math.PI / 2;
                const normalX = Math.cos(normalAngle);
                const normalY = Math.sin(normalAngle);
                
                // Dot product to determine direction of push
                const dx = seed.x - centerX;
                const dy = seed.y - centerY;
                const dotProduct = dx * normalX + dy * normalY;
                
                // Direction of rotation helps determine push direction
                const pushDirection = Math.sign(angleDelta) * Math.sign(dotProduct);
                
                // Start animation
                this.seedAnimating.set(seed, true);
                
                // Visual effect: push seed away from stick
                const pushDistance = 8; // Maximum push distance
                const pushAngle = normalAngle + (pushDirection < 0 ? Math.PI : 0);
                const targetX = seed.x + Math.cos(pushAngle) * pushDistance;
                const targetY = seed.y + Math.sin(pushAngle) * pushDistance;
                
                // Brighten seed to indicate collision
                seed.setTint(0xFFFFFF);
                
                // Tween the seed for push animation
                this.tweens.add({
                    targets: seed,
                    x: targetX,
                    y: targetY,
                    duration: 100,
                    ease: 'Quad.easeOut',
                    yoyo: true,
                    onComplete: () => {
                        // Reset to original position but NOT color (to maintain side indication)
                        const original = this.seedOriginalPositions.get(seed);
                        if (original) {
                            seed.x = original.x;
                            seed.y = original.y;
                        }
                        // Let updateSeedSides handle the tint
                        this.seedAnimating.set(seed, false);
                    }
                });
            }
        }
    }
    
    private updateSeedAnimations(delta: number) {
        // This method is used by the tweens now, but could be used for more complex animations
    }
    
    private distanceFromPointToLine(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) {
            param = dot / lenSq;
        }
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = px - xx;
        const dy = py - yy;
        
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    private updateSeedSides() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        
        // Calculate normal to the stick (perpendicular direction)
        const normalAngle = this.stick.rotation + Math.PI / 2;
        const normalX = Math.cos(normalAngle);
        const normalY = Math.sin(normalAngle);
        
        // Reset counts for visual verification
        this.leftSeedCount = 0;
        this.rightSeedCount = 0;
        
        this.seeds.forEach(seed => {
            // Skip seeds that are currently animating
            if (this.seedAnimating.get(seed)) return;
            
            // Vector from center to seed
            const dx = seed.x - centerX;
            const dy = seed.y - centerY;
            
            // Dot product with normal to determine side
            const dotProduct = dx * normalX + dy * normalY;
            
            if (dotProduct > 0) {
                // Left side
                seed.setTint(this.LEFT_SIDE_COLOR);
                this.leftSeedCount++;
            } else {
                // Right side
                seed.setTint(this.RIGHT_SIDE_COLOR);
                this.rightSeedCount++;
            }
        });
        
        // Update side counts during active rotation (for debugging/testing)
        if (this.isStickRotating && !this.isRoundComplete) {
            // Optional - can add visual indicators or counters here if desired
        }
    }
} 