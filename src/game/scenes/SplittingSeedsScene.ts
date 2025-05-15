import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class SplittingSeedsScene extends Scene {
    // Game objects
    private stick: Phaser.GameObjects.Image;
    private seeds: Phaser.GameObjects.Image[] = [];
    private birds: Phaser.GameObjects.Image[] = [];
    
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
    
    private readonly LEVEL_SEED_COUNTS: { [key: number]: number[] } = {
        1: [4, 6, 8],      
        2: [10, 12],        
        3: [12, 14, 16], 
        4: [14, 16, 18],     
        5: [18, 20],     
        6: [20, 22, 24], 
    };
    
    // UI elements
    private scoreText: Phaser.GameObjects.Text;
    private levelText: Phaser.GameObjects.Text;
    private timeText: Phaser.GameObjects.Text;
    private resultText: Phaser.GameObjects.Text;
    private leftCountText: Phaser.GameObjects.Text;
    private rightCountText: Phaser.GameObjects.Text;
    private resultSymbol: Phaser.GameObjects.Text;
    private resultBackground: Phaser.GameObjects.Rectangle;
    private headerBackground: Phaser.GameObjects.Rectangle;
    
    // Add these properties to the class
    private stickLineSegment: {x1: number, y1: number, x2: number, y2: number} = {x1: 0, y1: 0, x2: 0, y2: 0};
    private seedOriginalPositions: Map<Phaser.GameObjects.Image, {x: number, y: number}> = new Map();
    private seedAnimating: Map<Phaser.GameObjects.Image, boolean> = new Map();
    private stickAnglePrev: number = 0;
    
    // Add these color constants to the top of the class
    private readonly SEED_BASE_COLOR: number = 0xFFFFFF; // White color for seeds
    private readonly CONFIRM_LEFT_COLOR: number = 0x90EE90; // Light green for left side after confirmation
    private readonly CONFIRM_RIGHT_COLOR: number = 0x87CEFA; // Light blue for right side after confirmation
    
    // Asset keys
    private readonly SEED_KEY: string = 'splitting-seed';
    private readonly BACKGROUND_KEY: string = 'splitting-background';
    private readonly STICK_KEY: string = 'splitting-stick';
    private readonly LEFT_BIRD_KEY: string = 'splitting-left-bird';
    private readonly RIGHT_BIRD_KEY: string = 'splitting-right-bird';
    private readonly BG_SOUND_KEY: string = 'splitting-bg-sound';
    private readonly CHECK_SOUND_KEY: string = 'splitting-check-sound';
    private readonly SEED_SOUND_KEY: string = 'splitting-seed-sound';
    
    // Sound effects
    private bgSound: Phaser.Sound.BaseSound;
    private checkSound: Phaser.Sound.BaseSound;
    private seedSound: Phaser.Sound.BaseSound;
    private lastSeedSoundTime: number = 0;
    
    constructor() {
        super('SplittingSeedsScene');
    }
    
    preload() {
        // Load game assets
        this.load.image(this.SEED_KEY, 'assets/SplittingSeeds/seed.png');
        this.load.image(this.BACKGROUND_KEY, 'assets/SplittingSeeds/background.png');
        this.load.image(this.STICK_KEY, 'assets/SplittingSeeds/stick.png');
        this.load.image(this.LEFT_BIRD_KEY, 'assets/SplittingSeeds/bird-left.png');
        this.load.image(this.RIGHT_BIRD_KEY, 'assets/SplittingSeeds/bird-right.png');
        
        // Load sound assets
        this.load.audio(this.BG_SOUND_KEY, 'assets/SplittingSeeds/sfx/bg-sound.mp3');
        this.load.audio(this.CHECK_SOUND_KEY, 'assets/SplittingSeeds/sfx/check-sound.mp3');
        this.load.audio(this.SEED_SOUND_KEY, 'assets/SplittingSeeds/sfx/seed-sound.mp3');
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
        
        // Initialize sounds
        this.initSounds();
        
        // Setup input handling
        this.setupInput();
        
        // Start the game timer
        this.startGameTimer();
        
        // Start first round
        this.startNewRound();
        
        // Emit event that scene is ready
        EventBus.emit('current-scene-ready', this);
    }
    
    private initSounds() {
        // Create sounds
        this.bgSound = this.sound.add(this.BG_SOUND_KEY, {
            loop: true,
            volume: 0.5
        });
        
        this.checkSound = this.sound.add(this.CHECK_SOUND_KEY, {
            loop: false,
            volume: 0.8
        });
        
        this.seedSound = this.sound.add(this.SEED_SOUND_KEY, {
            loop: false,
            volume: 0.6
        });
        
        // Start playing background music
        this.bgSound.play();
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
            
            // Update stick rotation with the 90 degree correction
            this.stick.rotation = newAngle + Math.PI/2;
            
            // Update the stick line segment for collision detection using the logical angle (without correction)
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
        // Left bird
        const leftBird = this.add.image(100, this.cameras.main.height / 2, this.LEFT_BIRD_KEY);
        leftBird.setScale(0.2); // Adjust scale as needed based on your image size
        leftBird.setDepth(10);
        this.birds.push(leftBird);
        
        // Right bird
        const rightBird = this.add.image(this.cameras.main.width - 100, this.cameras.main.height / 2, this.RIGHT_BIRD_KEY);
        rightBird.setScale(0.2); // Adjust scale as needed based on your image size
        rightBird.setDepth(10);
        this.birds.push(rightBird);
    }
    
    private createStick() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        
        // Create stick as an image at the center
        this.stick = this.add.image(centerX, centerY, this.STICK_KEY);
        this.stick.setOrigin(0.5);
        
        this.stick.setScale(0.3, 0.5);
        
        this.stick.setDepth(1);
        const initialAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        this.stickAnglePrev = initialAngle;
        
        // Apply the initial angle plus 90 degrees correction to the image
        // This adjusts the visual orientation without affecting the logical angle
        this.stick.rotation = initialAngle + Math.PI/2;
        
        // Initialize stick line segment using the logical angle (without the 90 degree correction)
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
        
        // Create a header background
        this.headerBackground = this.add.rectangle(
            width / 2,
            30,
            width,
            60,
            0x000000,
            0.7
        );
        this.headerBackground.setDepth(90);
        
        // Score text
        this.scoreText = this.add.text(20, 18, 'SCORE: 0', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff'
        });
        this.scoreText.setDepth(100);
        
        // Level text
        this.levelText = this.add.text(width - 150, 18, 'LEVEL: 1', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff'
        });
        this.levelText.setDepth(100);
        
        // Time text
        this.timeText = this.add.text(width / 2, 18, 'TIME: 60', {
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
    }
    
    private createLevelDots() {
        const dotSpacing = 30;
        const dotSize = 15;
        const startX = this.cameras.main.width - 200;
        const y = 58;  // Adjusted to position dots below the level text, inside header
        
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
        
        // Hide count backgrounds
        if (this.leftCountText.getData('background')) {
            const leftBg = this.leftCountText.getData('background');
            leftBg.setVisible(false);
        }
        
        if (this.rightCountText.getData('background')) {
            const rightBg = this.rightCountText.getData('background');
            rightBg.setVisible(false);
        }
        
        this.resultSymbol.setVisible(false);
        this.resultBackground.setVisible(false);
        
        // Enable stick rotation
        this.isStickRotating = true;
        this.isRoundComplete = false;
        
        // Set random rotation for stick
        this.stick.rotation = Phaser.Math.FloatBetween(0, Math.PI * 2);
        
        // Get seed count options for current level
        const seedOptions = this.getSeedCountOptionsForLevel();
        
        // Select a random seed count from the options
        this.seedCount = Phaser.Utils.Array.GetRandom(seedOptions);
        
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
                seed.setScale(0.02, 0.02);
                seed.setDepth(5); // Higher depth so seeds appear above the stick
                
                // Set the base color (white) for all seeds
                seed.setTint(this.SEED_BASE_COLOR);
                
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
        
        // Store original positions for animation
        for (const seed of this.seeds) {
            this.seedOriginalPositions.set(seed, {x: seed.x, y: seed.y});
            this.seedAnimating.set(seed, false);
        }
    }
    
    private confirmStickPosition() {
        this.isStickRotating = false;
        this.isRoundComplete = true;
        
        // Play check sound
        this.checkSound.play();
        
        // Count seeds on each side of the stick
        this.countSeedsOnBothSides();
        
        // Show seed counts with new positioning
        this.updateSeedCountDisplay();
        
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
        
        // Get stick angle - IMPORTANT: Use the logical angle without 90-degree correction
        const stickAngle = this.stick.rotation - Math.PI / 2;
        
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
                // Use light green for left side after confirmation
                seed.setTint(this.CONFIRM_LEFT_COLOR);
            } else {
                this.rightSeedCount++;
                // Use light blue for right side after confirmation
                seed.setTint(this.CONFIRM_RIGHT_COLOR);
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
    }
    
    private handleIncorrectSplit() {
        // Show failure indicator
        this.resultSymbol.setText('X');
        this.resultSymbol.setColor('#FF6B6B'); // Light red color
        this.resultSymbol.setVisible(true);
        
        // Calculate difference
        const difference = Math.abs(this.leftSeedCount - this.rightSeedCount);
        const dotsLost = Math.min(4, Math.floor(difference / 2));
        
        // Update level progress negatively
        this.updateLevelProgress(false, dotsLost);
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
            let allFilled = true;
            for (let i = 0; i < this.levelDots.length; i++) {
                if (this.levelDots[i].fillColor === 0xffffff) {
                    allFilled = false;
                    break;
                }
            }
            
            if (allFilled) {
                this.levelUp();
            }
        } else {
            // Make it more forgiving for incorrect splits in early levels
            const adjustedDotsLost = this.level <= 2 ? Math.max(1, Math.floor(dotsLost / 2)) : dotsLost;
            
            // Remove progress dots based on adjusted dotsLost
            let unfilledCount = 0;
            for (let i = this.levelDots.length - 1; i >= 0; i--) {
                if (this.levelDots[i].fillColor !== 0xffffff && unfilledCount < adjustedDotsLost) {
                    this.levelDots[i].fillColor = 0xffffff;
                    unfilledCount++;
                }
            }
            
            // Level down only after level 2 and only if we've lost enough dots
            if (unfilledCount < adjustedDotsLost && this.level > 2) {
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
        
        // Stop background music
        this.bgSound.stop();
        
        // Calculate end-of-game bonus
        const bonus = 1000 * this.level;
        this.score += bonus;
        
        // Create overlay for background blur
        const overlay = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            this.cameras.main.width,
            this.cameras.main.height,
            0x000000,
            0.7
        );
        overlay.setDepth(99);
        
        // Create popup background
        const popupWidth = 400;
        const popupHeight = 300;
        const popup = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            popupWidth,
            popupHeight,
            0x333333,
            0.9
        );
        popup.setStrokeStyle(4, 0xffffff);
        popup.setDepth(100);
        
        // Round the corners
        popup.setInteractive();
        
        // Show game over text
        const gameOverText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 100,
            'GAME OVER',
            {
                fontFamily: 'Arial',
                fontSize: '40px',
                color: '#ffffff'
            }
        );
        gameOverText.setOrigin(0.5);
        gameOverText.setDepth(101);
        
        // Show final score with bonus
        const finalScoreText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 40,
            `Final Score: ${this.score}\nLevel Bonus: ${bonus}`,
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffffff',
                align: 'center'
            }
        );
        finalScoreText.setOrigin(0.5);
        finalScoreText.setDepth(101);
        
        // Create replay button
        const buttonWidth = 150;
        const buttonHeight = 50;
        const replayButton = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 50,
            buttonWidth,
            buttonHeight,
            0x4CAF50
        );
        replayButton.setDepth(101);
        replayButton.setInteractive({ useHandCursor: true });
        
        // Add button text
        const replayText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 50,
            'PLAY AGAIN',
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffffff'
            }
        );
        replayText.setOrigin(0.5);
        replayText.setDepth(102);
        
        // Add button hover effect
        replayButton.on('pointerover', () => {
            replayButton.fillColor = 0x66BB6A;
        });
        
        replayButton.on('pointerout', () => {
            replayButton.fillColor = 0x4CAF50;
        });
        
        // Add button click event to restart the game
        replayButton.on('pointerdown', () => {
            this.resetGame();
        });
    }
    
    private checkSeedCollisions(angleDelta: number) {
        if (Math.abs(angleDelta) < 0.001) return; // Skip if rotation is very small
        
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        const seedRadius = 15; // Seed radius
        
        let collisionDetected = false;
        
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
                collisionDetected = true;
                
                // Determine which side the seed will move to
                const angle = Math.atan2(seed.y - centerY, seed.x - centerX);
                // IMPORTANT: Use the logical angle without 90-degree correction
                const normalAngle = (this.stick.rotation - Math.PI / 2) + Math.PI / 2;
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
                
                // No color change during collision - keep seed's current color
                
                // Tween the seed for push animation
                this.tweens.add({
                    targets: seed,
                    x: targetX,
                    y: targetY,
                    duration: 100,
                    ease: 'Quad.easeOut',
                    yoyo: true,
                    onComplete: () => {
                        // Reset to original position but NOT color
                        const original = this.seedOriginalPositions.get(seed);
                        if (original) {
                            seed.x = original.x;
                            seed.y = original.y;
                        }
                        this.seedAnimating.set(seed, false);
                    }
                });
            }
        }
        
        // Play seed collision sound, but limit how often it can play
        if (collisionDetected) {
            const currentTime = this.time.now;
            // Only play the sound if it's been at least 100ms since the last play
            if (currentTime - this.lastSeedSoundTime > 100) {
                this.seedSound.play();
                this.lastSeedSoundTime = currentTime;
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
        // This method no longer changes seed colors during rotation - all seeds stay white
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        
        // Calculate normal to the stick (perpendicular direction)
        // IMPORTANT: Use the logical angle without 90-degree correction
        const normalAngle = (this.stick.rotation - Math.PI / 2) + Math.PI / 2;
        const normalX = Math.cos(normalAngle);
        const normalY = Math.sin(normalAngle);
        
        // Reset counts for verification
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
            
            // Just count sides, don't change colors during rotation
            if (dotProduct > 0) {
                this.leftSeedCount++;
            } else {
                this.rightSeedCount++;
            }
        });
    }
    
    private updateSeedCountDisplay() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        
        // Get stick angle without the 90-degree correction
        const stickAngle = this.stick.rotation - Math.PI / 2;
        
        // Calculate normal vector (perpendicular to the stick)
        const normalAngle = stickAngle + Math.PI / 2;
        
        // Calculate positions for count displays
        // Position the counts perpendicular to the stick at some distance
        const displayDistance = 150; // Distance from center
        
        // Left side position
        const leftX = centerX + Math.cos(normalAngle) * displayDistance;
        const leftY = centerY + Math.sin(normalAngle) * displayDistance;
        
        // Right side position
        const rightX = centerX - Math.cos(normalAngle) * displayDistance;
        const rightY = centerY - Math.sin(normalAngle) * displayDistance;
        
        // Update text position
        this.leftCountText.setPosition(leftX, leftY);
        this.rightCountText.setPosition(rightX, rightY);
        
        // Update text content
        this.leftCountText.setText(`${this.leftSeedCount}`);
        this.rightCountText.setText(`${this.rightSeedCount}`);
        
        // Add or update background for better visibility
        if (!this.leftCountText.getData('background')) {
            const leftBg = this.add.circle(leftX, leftY, 30, 0x000000, 0.6);
            leftBg.setDepth(99); // Below text
            this.leftCountText.setData('background', leftBg);
        } else {
            const leftBg = this.leftCountText.getData('background');
            leftBg.setPosition(leftX, leftY);
            leftBg.setVisible(true);
        }
        
        if (!this.rightCountText.getData('background')) {
            const rightBg = this.add.circle(rightX, rightY, 30, 0x000000, 0.6);
            rightBg.setDepth(99); // Below text
            this.rightCountText.setData('background', rightBg);
        } else {
            const rightBg = this.rightCountText.getData('background');
            rightBg.setPosition(rightX, rightY);
            rightBg.setVisible(true);
        }
        
        // Show the text
        this.leftCountText.setVisible(true);
        this.rightCountText.setVisible(true);
    }
    
    // Add a new method to reset the game completely
    private resetGame() {
        // Reset all game values
        this.score = 0;
        this.level = 1;
        this.timeLeft = 60;
        this.isStickRotating = false;
        this.isRoundComplete = false;
        this.seedCount = 0;
        this.leftSeedCount = 0;
        this.rightSeedCount = 0;
        
        // Reset UI elements
        this.scoreText.setText('SCORE: 0');
        this.levelText.setText('LEVEL: 1');
        this.timeText.setText('TIME: 60');
        
        // Reset level dots
        this.levelDots.forEach(dot => dot.fillColor = 0xffffff);
        
        // Stop any playing sounds before restarting
        if (this.bgSound) this.bgSound.stop();
        if (this.checkSound) this.checkSound.stop();
        if (this.seedSound) this.seedSound.stop();
        
        // Restart the scene
        this.scene.restart();
    }
    
    private getSeedCountOptionsForLevel(): number[] {
        const levelToUse = Math.min(this.level, this.maxLevel);
        return this.LEVEL_SEED_COUNTS[levelToUse] || this.LEVEL_SEED_COUNTS[this.maxLevel];
    }
} 