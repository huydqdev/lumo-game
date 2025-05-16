import { GameObjects, Scene } from 'phaser';

import { EventBus } from '../EventBus';

interface GameItem {
    id: string;
    name: string;
    imgKey: string;
    status: 'available' | 'locked';
    sceneKey: string;
}

export class MainMenu extends Scene
{
    headerTitle: GameObjects.Text;
    gameItems: GameObjects.Group;

    constructor ()
    {
        super('MainMenu');
    }

    preload ()
    {
        this.load.image('mainMenuBackground', 'assets/bg.png');
    }

    create ()
    {
        // Add the background image first
        const bgImage = this.add.image(0, 0, 'mainMenuBackground').setOrigin(0, 0);
        // Adjust size to fit the camera
        bgImage.displayWidth = this.cameras.main.width;
        bgImage.displayHeight = this.cameras.main.height;

        this.cameras.main.setBackgroundColor(0xf0f0f0);

        this.headerTitle = this.add.text(this.cameras.main.width / 2, 50, 'LUMO Games', {
            fontFamily: '"Fuzzy Bubbles", Arial, sans-serif',
            fontSize: 48,
            color: '#333333',
            stroke: '#ffffff',
            strokeThickness: 8,
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        const gameListData: GameItem[] = [
            { id: 'game0', name: 'Sky Traffic Control', imgKey: 'game_icon_0', status: 'available', sceneKey: 'SkyTrafficScene' },
            { id: 'game1', name: 'Splitting Seeds', imgKey: 'game_icon_1', status: 'available', sceneKey: 'SplittingSeedsScene' },
            { id: 'game2', name: 'Penguin Pursuit', imgKey: 'game_icon_1', status: 'available', sceneKey: 'PenguinPursuitGameplayScene' },
            { id: 'game3', name: 'Space Explorer', imgKey: 'game_icon_2', status: 'locked', sceneKey: 'SpaceExplorerScene' },
            // { id: 'game4', name: 'Puzzle Mania', imgKey: 'game_icon_3', status: 'locked', sceneKey: 'PuzzleManiaScene' },
            // { id: 'game5', name: 'Racing Challenge', imgKey: 'game_icon_4', status: 'locked', sceneKey: 'RacingChallengeScene' },
            // { id: 'game6', name: 'Fantasy Realm', imgKey: 'game_icon_5', status: 'locked', sceneKey: 'FantasyRealmScene' },
            // { id: 'game7', name: 'Strategy Kings', imgKey: 'game_icon_6', status: 'locked', sceneKey: 'StrategyKingsScene' },
            // { id: 'game8', name: 'Hidden Object', imgKey: 'game_icon_7', status: 'locked', sceneKey: 'HiddenObjectScene' },
            // { id: 'game9', name: 'Zombie Apocalypse', imgKey: 'game_icon_8', status: 'locked', sceneKey: 'ZombieApocalypseScene' },
            // { id: 'game10', name: 'Platformer Pro', imgKey: 'game_icon_9', status: 'locked', sceneKey: 'PlatformerProScene' },
        ];

        this.gameItems = this.add.group();

        const cols = 3;
        const itemWidth = 150;
        const itemHeight = 120;
        const spacingX = 50;
        const spacingY = 40;
        const startX = (this.cameras.main.width - (cols * itemWidth + (cols - 1) * spacingX)) / 2;
        const startY = 150;

        gameListData.forEach((gameData, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;

            const x = startX + col * (itemWidth + spacingX);
            const y = startY + row * (itemHeight + spacingY);

            const container = this.add.container(x, y);
            
            // Add background with rounded corners
            const background = this.add.graphics();
            const bgColor = gameData.status === 'available' ? 0xeaf2ff : 0xf0f0f0;
            const borderRadius = 15;
            
            background.fillStyle(bgColor, 1);
            background.fillRoundedRect(0, 0, itemWidth, itemHeight, borderRadius);
            background.lineStyle(2, 0xcccccc, 1);
            background.strokeRoundedRect(0, 0, itemWidth, itemHeight, borderRadius);
            
            container.add(background);
            
            // Create text element with increased font size
            const gameNameText = this.add.text(itemWidth / 2, itemHeight / 2, gameData.name, {
                fontFamily: '"Fuzzy Bubbles", Arial, sans-serif',
                fontSize: 24,
                color: '#333333',
                align: 'center',
                stroke: '#ffffff',
                strokeThickness: 3,
                wordWrap: { width: itemWidth - 10, useAdvancedWrap: true }
            }).setOrigin(0.5, 0.5);

            container.add(gameNameText);
            
            // Make hitbox more explicit with a transparent button
            const hitZone = this.add.zone(0, 0, itemWidth, itemHeight).setOrigin(0);
            hitZone.setInteractive();
            container.add(hitZone);
            
            // Debug visualization for hitbox - uncomment to see hitboxes
            /*
            const hitboxVisualization = this.add.graphics();
            hitboxVisualization.lineStyle(2, 0xff0000);
            hitboxVisualization.strokeRect(0, 0, itemWidth, itemHeight);
            container.add(hitboxVisualization);
            */

            if (gameData.status === 'locked') {
                const lockIcon = this.add.text(itemWidth - 10, 10, '🔒', { fontSize: '24px', color: 'yellow' }).setOrigin(1,0);
                container.add(lockIcon);
            }

            // Add event listeners to the hitZone instead of the container
            hitZone.on('pointerdown', () => {
                if (gameData.status === 'available') {
                    this.scene.start(gameData.sceneKey);
                } else {
                    alert(`${gameData.name} is currently locked!`);
                    console.log(`${gameData.name} is locked. Scene: ${gameData.sceneKey}`);
                }
            });

            hitZone.on('pointerover', () => {
                gameNameText.setStyle({ color: '#0066CC' });
                background.clear();
                background.fillStyle(0xd4e6ff, 1);
                background.fillRoundedRect(0, 0, itemWidth, itemHeight, borderRadius);
                background.lineStyle(2, 0x0066CC, 1);
                background.strokeRoundedRect(0, 0, itemWidth, itemHeight, borderRadius);
            });
            
            hitZone.on('pointerout', () => {
                gameNameText.setStyle({ color: '#333333' });
                background.clear();
                background.fillStyle(bgColor, 1);
                background.fillRoundedRect(0, 0, itemWidth, itemHeight, borderRadius);
                background.lineStyle(2, 0xcccccc, 1);
                background.strokeRoundedRect(0, 0, itemWidth, itemHeight, borderRadius);
            });

            this.gameItems.add(container);
        });

        EventBus.emit('current-scene-ready', this);
    }
}
