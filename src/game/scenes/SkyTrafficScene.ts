import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

// Define interfaces for game elements
interface Airplane {
    sprite: Phaser.GameObjects.Arc;
    color: string;
    speed: number;
    currentPath: number[];
    pathIndex: number;
    destinationStrip: number;
    isLanding: boolean;
}

interface LandingStrip {
    sprite: Phaser.GameObjects.Rectangle;
    color: string;
    position: { x: number, y: number };
    isOccupied: boolean;
}

interface JunctionNode {
    sprite: Phaser.GameObjects.Arc;
    position: { x: number, y: number };
    routes: number[][];
    currentRouteIndex: number;
    arrows: Phaser.GameObjects.Triangle[];
}

interface Path {
    points: { x: number, y: number }[];
}

export class SkyTrafficScene extends Scene {
    // Game elements
    private airplanes: Airplane[] = [];
    private landingStrips: LandingStrip[] = [];
    private junctionNodes: JunctionNode[] = [];
    private paths: Path[] = [];

    // Game state
    private score: number = 0;
    private lives: number = 3;
    private level: number = 1;
    private isPaused: boolean = false;
    private isGameOver: boolean = false;

    // UI elements
    private scoreText: Phaser.GameObjects.Text;
    private livesText: Phaser.GameObjects.Text;
    private levelText: Phaser.GameObjects.Text;
    private pauseButton: Phaser.GameObjects.Text;

    // Timers
    private spawnTimer: Phaser.Time.TimerEvent;
    private weatherTimer: Phaser.Time.TimerEvent;

    // Colors for game elements
    private colors = ['red', 'blue', 'green', 'yellow', 'purple'];

    constructor() {
        super('SkyTrafficScene');
    }

    create() {
        // Reset game state
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.isPaused = false;
        this.isGameOver = false;
        this.planesSpawned = false;

        // Clear any existing game elements
        this.airplanes = [];
        this.landingStrips = [];
        this.junctionNodes = [];
        this.paths = [];

        // Set background
        this.cameras.main.setBackgroundColor(0x002200);

        // Draw radar grid
        this.drawRadarGrid();

        // Create UI elements
        this.createUI();

        // Initialize game elements based on level
        this.setupLevel(this.level);

        // Set up input handlers
        this.input.on('gameobjectdown', this.handleNodeClick, this);
        if (this.input.keyboard) {
            this.input.keyboard.on('keydown-P', this.togglePause, this);
        }

        // Start spawn timer with a slight delay to ensure everything is set up
        this.time.delayedCall(1000, () => {
            this.startSpawnTimer();
        });

        // Start weather timer (for higher levels)
        if (this.level >= 5) {
            this.startWeatherTimer();
        }

        // Display instructions
        const instructions = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height - 50,
            'Click on junction nodes to direct planes to matching landing strips',
            {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#ffffff',
                align: 'center'
            }
        ).setOrigin(0.5);

        // Fade out instructions after a delay
        this.time.delayedCall(5000, () => {
            this.tweens.add({
                targets: instructions,
                alpha: 0,
                duration: 1000,
                onComplete: () => {
                    instructions.destroy();
                }
            });
        });

        EventBus.emit('current-scene-ready', this);
    }

    update() {
        if (this.isPaused || this.isGameOver) return;

        // Update airplane positions
        this.updateAirplanes();

        // Check for collisions
        this.checkCollisions();

        // Check for landings
        this.checkLandings();

        // Check if level is complete
        this.checkLevelComplete();
    }

    private drawRadarGrid() {
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x00ff00, 0.3);

        // Draw horizontal lines
        for (let y = 0; y < this.cameras.main.height; y += 50) {
            graphics.moveTo(0, y);
            graphics.lineTo(this.cameras.main.width, y);
        }

        // Draw vertical lines
        for (let x = 0; x < this.cameras.main.width; x += 50) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, this.cameras.main.height);
        }

        // Draw radar circles
        graphics.strokeCircle(this.cameras.main.width / 2, this.cameras.main.height / 2, 100);
        graphics.strokeCircle(this.cameras.main.width / 2, this.cameras.main.height / 2, 200);
        graphics.strokeCircle(this.cameras.main.width / 2, this.cameras.main.height / 2, 300);

        graphics.stroke();
    }

    private createUI() {
        // Score text
        this.scoreText = this.add.text(20, 20, 'Score: 0', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#00ff00'
        });

        // Lives text
        this.livesText = this.add.text(20, 50, 'Lives: 3', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#00ff00'
        });

        // Level text
        this.levelText = this.add.text(20, 80, 'Level: 1', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#00ff00'
        });

        // Pause button
        this.pauseButton = this.add.text(this.cameras.main.width - 100, 20, 'PAUSE', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#00ff00',
            backgroundColor: '#003300'
        }).setInteractive();

        this.pauseButton.on('pointerdown', this.togglePause, this);
    }

    private setupLevel(level: number) {
        // Clear existing elements
        this.clearLevel();

        // Set up paths
        this.createPaths(level);

        // Set up landing strips
        this.createLandingStrips(level);

        // Set up junction nodes
        this.createJunctionNodes(level);

        // Update UI
        this.levelText.setText(`Level: ${level}`);
    }

    private clearLevel() {
        // Clear airplanes
        this.airplanes.forEach(airplane => {
            airplane.sprite.destroy();
        });
        this.airplanes = [];

        // Clear landing strips
        this.landingStrips.forEach(strip => {
            strip.sprite.destroy();
        });
        this.landingStrips = [];

        // Clear junction nodes
        this.junctionNodes.forEach(node => {
            node.sprite.destroy();
            node.arrows.forEach(arrow => arrow.destroy());
        });
        this.junctionNodes = [];

        // Clear paths
        this.paths = [];

        // Clear timers
        if (this.spawnTimer) this.spawnTimer.destroy();
        if (this.weatherTimer) this.weatherTimer.destroy();
    }

    private createPaths(level: number) {
        // Create basic paths based on level
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const centerX = width / 2;
        const centerY = height / 2;

        // Clear existing paths
        this.paths = [];

        // Create a simpler path system for better visibility
        // Horizontal path through the center
        this.paths.push({
            points: [
                { x: 0, y: centerY },
                { x: width, y: centerY }
            ]
        });

        // Vertical path through the center
        this.paths.push({
            points: [
                { x: centerX, y: 0 },
                { x: centerX, y: height }
            ]
        });

        // Add a few more paths based on level
        if (level >= 2) {
            // Top horizontal path
            this.paths.push({
                points: [
                    { x: 0, y: centerY - 150 },
                    { x: width, y: centerY - 150 }
                ]
            });

            // Bottom horizontal path
            this.paths.push({
                points: [
                    { x: 0, y: centerY + 150 },
                    { x: width, y: centerY + 150 }
                ]
            });
        }

        if (level >= 3) {
            // Left vertical path
            this.paths.push({
                points: [
                    { x: centerX - 150, y: 0 },
                    { x: centerX - 150, y: height }
                ]
            });

            // Right vertical path
            this.paths.push({
                points: [
                    { x: centerX + 150, y: 0 },
                    { x: centerX + 150, y: height }
                ]
            });
        }

        // Draw the paths visibly
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0x00ff00, 0.5);

        this.paths.forEach(path => {
            if (path.points.length >= 2) {
                graphics.beginPath();
                graphics.moveTo(path.points[0].x, path.points[0].y);
                for (let i = 1; i < path.points.length; i++) {
                    graphics.lineTo(path.points[i].x, path.points[i].y);
                }
                graphics.strokePath();
            }
        });
    }

    private createLandingStrips(level: number) {
        // Number of landing strips based on level
        const numStrips = Math.min(this.colors.length, Math.floor(level / 2) + 1);
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Create landing strips at the edges
        for (let i = 0; i < numStrips; i++) {
            const color = this.colors[i];
            let x: number = 0;
            let y: number = 0;

            // Position strips around the edges
            switch (i % 4) {
                case 0: // Top
                    x = width / (numStrips + 1) * (i + 1);
                    y = 20;
                    break;
                case 1: // Right
                    x = width - 20;
                    y = height / (numStrips + 1) * (i + 1);
                    break;
                case 2: // Bottom
                    x = width / (numStrips + 1) * (i + 1);
                    y = height - 20;
                    break;
                case 3: // Left
                    x = 20;
                    y = height / (numStrips + 1) * (i + 1);
                    break;
            }

            // Create strip
            const strip = this.add.rectangle(x, y, 60, 30, this.getColorValue(color));
            strip.setStrokeStyle(2, 0xffffff);
            strip.setInteractive();

            this.landingStrips.push({
                sprite: strip,
                color,
                position: { x, y },
                isOccupied: false
            });
        }
    }

    private createJunctionNodes(level: number) {
        // Number of junction nodes based on level
        const numNodes = Math.min(6, level + 1);
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Create junction nodes at intersections of paths
        for (let i = 0; i < numNodes; i++) {
            // Calculate position based on grid
            const gridX = i % 3;
            const gridY = Math.floor(i / 3);

            const x = width * 0.25 + gridX * (width * 0.25);
            const y = height * 0.25 + gridY * (height * 0.25);

            // Create node sprite
            const node = this.add.circle(x, y, 15, 0xffffff);
            node.setInteractive();

            // Find paths that are close to this junction
            const nearbyPaths = [];
            for (let j = 0; j < this.paths.length; j++) {
                const path = this.paths[j];
                // Check if junction is close to any point on the path
                for (const point of path.points) {
                    const distance = this.distanceBetween(x, y, point.x, point.y);
                    if (distance < 50) {
                        nearbyPaths.push(j);
                        break;
                    }
                }
            }

            // If no nearby paths, use default paths
            if (nearbyPaths.length === 0) {
                for (let j = 0; j < Math.min(3, this.paths.length); j++) {
                    nearbyPaths.push(j);
                }
            }

            // Create routes for this node
            const routes = [];
            for (let j = 0; j < Math.min(3, nearbyPaths.length); j++) {
                routes.push([
                    nearbyPaths[0], // Always use the first path as source
                    nearbyPaths[j]  // Use different paths as destinations
                ]);
            }

            // Ensure we have at least one route
            if (routes.length === 0 && this.paths.length > 0) {
                routes.push([0, 0]); // Default route
            }

            // Create arrows to visualize current route
            const arrows = [];
            const arrow = this.add.triangle(x, y - 25, 0, 10, 10, -10, -10, -10, 0x00ff00);
            arrows.push(arrow);

            this.junctionNodes.push({
                sprite: node,
                position: { x, y },
                routes,
                currentRouteIndex: 0,
                arrows
            });

            // Update arrow direction for initial route
            if (routes.length > 0) {
                this.updateJunctionArrows(this.junctionNodes[this.junctionNodes.length - 1]);
            }
        }
    }

    private startSpawnTimer() {
        // Spawn rate based on level (faster spawns at higher levels)
        const spawnRate = Math.max(5000 - (this.level * 500), 1000);

        this.spawnTimer = this.time.addEvent({
            delay: spawnRate,
            callback: this.spawnAirplane,
            callbackScope: this,
            loop: true
        });
    }

    private startWeatherTimer() {
        // Weather events occur randomly
        this.weatherTimer = this.time.addEvent({
            delay: 10000, // Every 10 seconds
            callback: this.triggerWeatherEvent,
            callbackScope: this,
            loop: true
        });
    }

    private spawnAirplane() {
        if (this.isPaused || this.isGameOver) return;

        // Limit number of airplanes based on level
        const maxAirplanes = Math.min(5, this.level);
        if (this.airplanes.length >= maxAirplanes) return;

        // Check if we have landing strips before spawning
        if (this.landingStrips.length === 0) return;

        // Choose random color from available colors
        const colorIndex = Math.floor(Math.random() * this.landingStrips.length);
        const color = this.landingStrips[colorIndex].color;

        // Choose random path to spawn on
        const pathIndex = Math.floor(Math.random() * this.paths.length);
        const path = this.paths[pathIndex];

        // Determine if airplane starts at beginning or end of path
        const startAtBeginning = Math.random() > 0.5;
        const startPoint = startAtBeginning ? path.points[0] : path.points[path.points.length - 1];

        // Create airplane sprite
        const airplane = this.add.circle(startPoint.x, startPoint.y, 10, this.getColorValue(color));
        airplane.setInteractive();

        // Add to airplanes array
        this.airplanes.push({
            sprite: airplane,
            color,
            speed: 100 + Math.random() * 50, // Base speed with some randomness
            currentPath: [pathIndex],
            pathIndex: startAtBeginning ? 0 : path.points.length - 1,
            destinationStrip: colorIndex,
            isLanding: false
        });

        // Mark that planes have been spawned for this level
        this.planesSpawned = true;
    }

    private updateAirplanes() {
        const delta = this.game.loop.delta / 1000; // Delta time in seconds

        this.airplanes.forEach(airplane => {
            if (airplane.isLanding) return;

            // Get current path
            const pathIndex = airplane.currentPath[airplane.currentPath.length - 1];
            if (pathIndex >= this.paths.length) {
                console.error('Invalid path index:', pathIndex, 'Total paths:', this.paths.length);
                return;
            }

            const path = this.paths[pathIndex];
            if (!path || !path.points || path.points.length < 2) {
                console.error('Invalid path:', path);
                return;
            }

            // Get target point on path
            const targetIndex = airplane.pathIndex < path.points.length - 1 ?
                airplane.pathIndex + 1 : airplane.pathIndex - 1;
            const target = path.points[targetIndex];

            // Calculate direction to target
            const dx = target.x - airplane.sprite.x;
            const dy = target.y - airplane.sprite.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Move airplane towards target
            if (distance > 5) {
                const speed = airplane.speed * delta;
                const moveX = (dx / distance) * speed;
                const moveY = (dy / distance) * speed;

                airplane.sprite.x += moveX;
                airplane.sprite.y += moveY;
            } else {
                // Reached target point
                airplane.pathIndex = targetIndex;

                // If reached end of path, check for junction or edge
                if (targetIndex === 0 || targetIndex === path.points.length - 1) {
                    // Check if at a junction node
                    const junction = this.findJunctionAtPosition(airplane.sprite.x, airplane.sprite.y);

                    if (junction) {
                        console.log('Airplane at junction:', junction);
                        // Follow junction's current route
                        if (junction.routes && junction.routes.length > 0 &&
                            junction.currentRouteIndex < junction.routes.length) {

                            const route = junction.routes[junction.currentRouteIndex];
                            if (route && route.length >= 2 && route[1] < this.paths.length) {
                                const newPathIndex = route[1]; // Second path in the route

                                // Add new path to airplane's path
                                airplane.currentPath.push(newPathIndex);

                                // Reset path index based on which end of the path we're at
                                const newPath = this.paths[newPathIndex];
                                if (newPath && newPath.points && newPath.points.length >= 2) {
                                    const distToStart = this.distanceBetween(
                                        airplane.sprite.x, airplane.sprite.y,
                                        newPath.points[0].x, newPath.points[0].y
                                    );
                                    const distToEnd = this.distanceBetween(
                                        airplane.sprite.x, airplane.sprite.y,
                                        newPath.points[newPath.points.length - 1].x, newPath.points[newPath.points.length - 1].y
                                    );

                                    airplane.pathIndex = distToStart < distToEnd ? 0 : newPath.points.length - 1;
                                }
                            } else {
                                console.error('Invalid route:', route);
                            }
                        } else {
                            console.error('Invalid routes for junction:', junction);
                        }
                    }

                    // Check if at a landing strip
                    const strip = this.findLandingStripAtPosition(airplane.sprite.x, airplane.sprite.y);

                    if (strip) {
                        console.log('Airplane at landing strip:', strip, 'Airplane color:', airplane.color, 'Strip color:', strip.color);
                        // Check if this is the correct landing strip
                        if (strip.color === airplane.color && !strip.isOccupied) {
                            this.landAirplane(airplane, strip);
                        } else {
                            // Wrong landing strip or occupied
                            this.handleCrash(airplane);
                        }
                    }
                }
            }
        });
    }

    private checkCollisions() {
        // Check for collisions between airplanes
        for (let i = 0; i < this.airplanes.length; i++) {
            for (let j = i + 1; j < this.airplanes.length; j++) {
                const a1 = this.airplanes[i];
                const a2 = this.airplanes[j];

                if (a1.isLanding || a2.isLanding) continue;

                const distance = this.distanceBetween(
                    a1.sprite.x, a1.sprite.y,
                    a2.sprite.x, a2.sprite.y
                );

                if (distance < 20) {
                    // Collision detected
                    this.handleCollision(a1, a2);
                    break;
                }
            }
        }
    }

    private checkLandings() {
        // Nothing to do here, landings are handled in updateAirplanes
    }

    // Track if any planes have been spawned in this level
    private planesSpawned: boolean = false;

    private checkLevelComplete() {
        // Level is complete when at least one plane has been spawned and all have landed
        if (this.planesSpawned && this.airplanes.length === 0 && this.spawnTimer && !this.spawnTimer.paused) {
            // Pause spawn timer
            this.spawnTimer.paused = true;

            // Show level complete message
            const levelCompleteText = this.add.text(
                this.cameras.main.width / 2,
                this.cameras.main.height / 2,
                'Level Complete!',
                {
                    fontFamily: 'Arial',
                    fontSize: '48px',
                    color: '#00ff00',
                    stroke: '#000000',
                    strokeThickness: 6
                }
            ).setOrigin(0.5);

            // Add bonus for error-free level
            if (this.lives === 3) {
                this.score += 200;
                this.scoreText.setText(`Score: ${this.score}`);

                const bonusText = this.add.text(
                    this.cameras.main.width / 2,
                    this.cameras.main.height / 2 + 60,
                    'Perfect Level Bonus: +200',
                    {
                        fontFamily: 'Arial',
                        fontSize: '24px',
                        color: '#ffff00'
                    }
                ).setOrigin(0.5);

                // Fade out bonus text
                this.tweens.add({
                    targets: bonusText,
                    alpha: 0,
                    duration: 2000,
                    delay: 1000
                });
            }

            // Advance to next level after delay
            this.time.delayedCall(3000, () => {
                levelCompleteText.destroy();
                this.level++;
                this.planesSpawned = false; // Reset for next level
                this.setupLevel(this.level);
                this.startSpawnTimer();
                if (this.level >= 5) {
                    this.startWeatherTimer();
                }
            });
        }
    }

    private handleNodeClick(_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) {
        if (this.isPaused || this.isGameOver) return;

        // Find which junction node was clicked
        const junction = this.junctionNodes.find(node => node.sprite === gameObject);

        if (junction) {
            // Toggle to next route
            junction.currentRouteIndex = (junction.currentRouteIndex + 1) % junction.routes.length;

            // Update arrow direction
            this.updateJunctionArrows(junction);

            // Play click sound
            // this.sound.play('click');
        }
    }

    private updateJunctionArrows(junction: JunctionNode) {
        try {
            // Make sure we have routes and arrows
            if (junction.routes.length === 0 || junction.arrows.length === 0) {
                return;
            }

            // Make sure the current route index is valid
            if (junction.currentRouteIndex >= junction.routes.length) {
                junction.currentRouteIndex = 0;
            }

            // Update arrow direction based on current route
            const route = junction.routes[junction.currentRouteIndex];

            // Make sure the target path index is valid
            if (!route || route.length < 2 || route[1] >= this.paths.length) {
                return;
            }

            const targetPathIndex = route[1];
            const targetPath = this.paths[targetPathIndex];

            // Make sure the target path has points
            if (!targetPath || !targetPath.points || targetPath.points.length === 0) {
                return;
            }

            // Calculate angle to target path
            const targetPoint = targetPath.points[0]; // Just use first point for simplicity
            const dx = targetPoint.x - junction.position.x;
            const dy = targetPoint.y - junction.position.y;
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);

            // Update arrow rotation
            junction.arrows[0].setRotation(angle * (Math.PI / 180));
        } catch (error) {
            console.error('Error updating junction arrows:', error);
        }
    }

    private landAirplane(airplane: Airplane, strip: LandingStrip) {
        // Mark airplane as landing
        airplane.isLanding = true;
        strip.isOccupied = true;

        // Animate landing
        this.tweens.add({
            targets: airplane.sprite,
            x: strip.position.x,
            y: strip.position.y,
            scale: 0.5,
            duration: 1000,
            onComplete: () => {
                // Remove airplane
                const index = this.airplanes.indexOf(airplane);
                if (index !== -1) {
                    this.airplanes.splice(index, 1);
                }
                airplane.sprite.destroy();

                // Free up landing strip after delay
                this.time.delayedCall(1000, () => {
                    strip.isOccupied = false;
                });

                // Add score
                this.score += 100;
                this.scoreText.setText(`Score: ${this.score}`);

                // Play landing sound
                // this.sound.play('landing');
            }
        });
    }

    private handleCrash(airplane: Airplane) {
        // Create explosion effect
        const explosion = this.add.circle(
            airplane.sprite.x,
            airplane.sprite.y,
            20,
            0xff0000
        );

        // Animate explosion
        this.tweens.add({
            targets: explosion,
            scale: 2,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                explosion.destroy();
            }
        });

        // Remove airplane
        const index = this.airplanes.indexOf(airplane);
        if (index !== -1) {
            this.airplanes.splice(index, 1);
        }
        airplane.sprite.destroy();

        // Lose a life
        this.lives--;
        this.livesText.setText(`Lives: ${this.lives}`);

        // Check game over
        if (this.lives <= 0) {
            this.gameOver();
        }

        // Play crash sound
        // this.sound.play('crash');
    }

    private handleCollision(airplane1: Airplane, airplane2: Airplane) {
        // Handle both airplanes crashing
        this.handleCrash(airplane1);
        this.handleCrash(airplane2);
    }

    private gameOver() {
        this.isGameOver = true;

        // Stop timers
        if (this.spawnTimer) this.spawnTimer.destroy();
        if (this.weatherTimer) this.weatherTimer.destroy();

        // Show game over message
        this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            'Game Over',
            {
                fontFamily: 'Arial',
                fontSize: '64px',
                color: '#ff0000',
                stroke: '#000000',
                strokeThickness: 8
            }
        ).setOrigin(0.5);

        // Show final score
        this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 80,
            `Final Score: ${this.score}`,
            {
                fontFamily: 'Arial',
                fontSize: '32px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);

        // Add restart button
        const restartButton = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 150,
            'Restart',
            {
                fontFamily: 'Arial',
                fontSize: '32px',
                color: '#00ff00',
                backgroundColor: '#003300',
                padding: { x: 20, y: 10 }
            }
        ).setOrigin(0.5).setInteractive();

        restartButton.on('pointerdown', () => {
            this.scene.restart();
        });

        // Add main menu button
        const menuButton = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 220,
            'Main Menu',
            {
                fontFamily: 'Arial',
                fontSize: '32px',
                color: '#00ff00',
                backgroundColor: '#003300',
                padding: { x: 20, y: 10 }
            }
        ).setOrigin(0.5).setInteractive();

        menuButton.on('pointerdown', () => {
            this.scene.start('MainMenu');
        });

        // Save high score to local storage
        const highScore = localStorage.getItem('skyTrafficHighScore') || '0';
        if (this.score > parseInt(highScore)) {
            localStorage.setItem('skyTrafficHighScore', this.score.toString());
        }
    }

    private togglePause() {
        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            // Pause timers
            if (this.spawnTimer) this.spawnTimer.paused = true;
            if (this.weatherTimer) this.weatherTimer.paused = true;

            // Show pause message
            const pauseText = this.add.text(
                this.cameras.main.width / 2,
                this.cameras.main.height / 2,
                'PAUSED',
                {
                    fontFamily: 'Arial',
                    fontSize: '64px',
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 8
                }
            ).setOrigin(0.5).setDepth(1000);

            this.pauseButton.setText('RESUME');

            // Store pause text for later removal
            this.registry.set('pauseText', pauseText);
        } else {
            // Resume timers
            if (this.spawnTimer) this.spawnTimer.paused = false;
            if (this.weatherTimer) this.weatherTimer.paused = false;

            // Remove pause message
            const pauseText = this.registry.get('pauseText');
            if (pauseText) pauseText.destroy();

            this.pauseButton.setText('PAUSE');
        }
    }

    private triggerWeatherEvent() {
        if (this.isPaused || this.isGameOver) return;

        // Chance of weather event based on level
        const weatherChance = Math.min(5 + (this.level * 2), 30); // Max 30% chance

        if (Math.random() * 100 < weatherChance) {
            // Choose between wind gust and fog
            if (Math.random() > 0.5) {
                this.triggerWindGust();
            } else {
                this.triggerFog();
            }
        }
    }

    private triggerWindGust() {
        // Show wind effect
        const windText = this.add.text(
            this.cameras.main.width / 2,
            100,
            '💨 Wind Gust 💨',
            {
                fontFamily: 'Arial',
                fontSize: '32px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);

        // Affect all airplanes
        this.airplanes.forEach(airplane => {
            // Randomly increase or decrease speed by up to 10%
            const speedChange = 1 + (Math.random() * 0.2 - 0.1);
            airplane.speed *= speedChange;
        });

        // Fade out wind text
        this.tweens.add({
            targets: windText,
            alpha: 0,
            duration: 2000,
            onComplete: () => {
                windText.destroy();
            }
        });
    }

    private triggerFog() {
        // Create fog overlay
        const fog = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            this.cameras.main.width,
            this.cameras.main.height,
            0xaaaaaa
        ).setAlpha(0);

        // Fade in fog
        this.tweens.add({
            targets: fog,
            alpha: 0.7,
            duration: 1000
        });

        // Show fog text
        const fogText = this.add.text(
            this.cameras.main.width / 2,
            100,
            '🌫️ Fog Rolling In 🌫️',
            {
                fontFamily: 'Arial',
                fontSize: '32px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);

        // Fade out fog after 5 seconds
        this.time.delayedCall(5000, () => {
            this.tweens.add({
                targets: fog,
                alpha: 0,
                duration: 1000,
                onComplete: () => {
                    fog.destroy();
                }
            });

            // Fade out fog text
            this.tweens.add({
                targets: fogText,
                alpha: 0,
                duration: 1000,
                onComplete: () => {
                    fogText.destroy();
                }
            });
        });
    }

    // Helper methods
    private findJunctionAtPosition(x: number, y: number): JunctionNode | undefined {
        if (!this.junctionNodes || this.junctionNodes.length === 0) {
            return undefined;
        }

        return this.junctionNodes.find(junction => {
            if (!junction || !junction.position) return false;
            const distance = this.distanceBetween(x, y, junction.position.x, junction.position.y);
            return distance < 30; // Increased detection radius
        });
    }

    private findLandingStripAtPosition(x: number, y: number): LandingStrip | undefined {
        if (!this.landingStrips || this.landingStrips.length === 0) {
            return undefined;
        }

        return this.landingStrips.find(strip => {
            if (!strip || !strip.position) return false;
            const distance = this.distanceBetween(x, y, strip.position.x, strip.position.y);
            return distance < 40; // Increased detection radius
        });
    }

    private distanceBetween(x1: number, y1: number, x2: number, y2: number): number {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    private getColorValue(color: string): number {
        switch (color) {
            case 'red': return 0xff0000;
            case 'blue': return 0x0000ff;
            case 'green': return 0x00ff00;
            case 'yellow': return 0xffff00;
            case 'purple': return 0xff00ff;
            default: return 0xffffff;
        }
    }
}
