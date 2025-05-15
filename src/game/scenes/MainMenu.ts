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

    create ()
    {
        this.cameras.main.setBackgroundColor(0xf0f0f0);

        this.headerTitle = this.add.text(this.cameras.main.width / 2, 50, 'Select a Game', {
            fontFamily: 'Arial Black',
            fontSize: 48,
            color: '#333333',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        const gameListData: GameItem[] = [
            { id: 'game0', name: 'Sky Traffic Control', imgKey: 'game_icon_0', status: 'available', sceneKey: 'SkyTrafficScene' },
            { id: 'game1', name: 'Splitting Seeds', imgKey: 'game_icon_1', status: 'available', sceneKey: 'SplittingSeedsScene' },
            { id: 'game2', name: 'Penguin Pursuit', imgKey: 'game_icon_1', status: 'available', sceneKey: 'PenguinPursuitGameplayScene' },
            { id: 'game3', name: 'Space Explorer', imgKey: 'game_icon_2', status: 'locked', sceneKey: 'SpaceExplorerScene' },
            { id: 'game4', name: 'Puzzle Mania', imgKey: 'game_icon_3', status: 'locked', sceneKey: 'PuzzleManiaScene' },
            { id: 'game5', name: 'Racing Challenge', imgKey: 'game_icon_4', status: 'locked', sceneKey: 'RacingChallengeScene' },
            { id: 'game6', name: 'Fantasy Realm', imgKey: 'game_icon_5', status: 'locked', sceneKey: 'FantasyRealmScene' },
            { id: 'game7', name: 'Strategy Kings', imgKey: 'game_icon_6', status: 'locked', sceneKey: 'StrategyKingsScene' },
            { id: 'game8', name: 'Hidden Object', imgKey: 'game_icon_7', status: 'locked', sceneKey: 'HiddenObjectScene' },
            { id: 'game9', name: 'Zombie Apocalypse', imgKey: 'game_icon_8', status: 'locked', sceneKey: 'ZombieApocalypseScene' },
            { id: 'game10', name: 'Platformer Pro', imgKey: 'game_icon_9', status: 'locked', sceneKey: 'PlatformerProScene' },
        ];

        this.gameItems = this.add.group();

        const cols = 3;
        const itemWidth = 150;
        const itemHeight = 180;
        const spacingX = 50;
        const spacingY = 50;
        const startX = (this.cameras.main.width - (cols * itemWidth + (cols - 1) * spacingX)) / 2;
        const startY = 150;

        gameListData.forEach((gameData, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;

            const x = startX + col * (itemWidth + spacingX);
            const y = startY + row * (itemHeight + spacingY);

            const container = this.add.container(x, y);
            let gameImage: GameObjects.Image | GameObjects.Rectangle;
            if (this.textures.exists(gameData.imgKey)) {
                gameImage = this.add.image(itemWidth / 2, 0, gameData.imgKey).setDisplaySize(100, 100).setOrigin(0.5, 0);
            } else {
                console.warn(`Texture not found for ${gameData.imgKey}, using placeholder for ${gameData.name}`);
                gameImage = this.add.rectangle(itemWidth / 2, 0, 100, 100, 0x666666).setOrigin(0.5, 0);
            }

            const gameNameText = this.add.text(itemWidth / 2, 110, gameData.name, {
                fontFamily: 'Arial',
                fontSize: 16,
                color: '#333333',
                align: 'center',
                wordWrap: { width: itemWidth - 10, useAdvancedWrap: true }
            }).setOrigin(0.5, 0);

            container.add([gameImage, gameNameText]);
            container.setSize(itemWidth, itemHeight);
            container.setInteractive(new Phaser.Geom.Rectangle(0,0, itemWidth, itemHeight), Phaser.Geom.Rectangle.Contains);

            if (gameData.status === 'locked') {
                const lockIcon = this.add.text(itemWidth - 10, 10, '🔒', { fontSize: '24px', color: 'yellow' }).setOrigin(1,0);
                container.add(lockIcon);
            }

            container.on('pointerdown', () => {
                if (gameData.status === 'available') {
                    this.scene.start(gameData.sceneKey);
                } else {
                    alert(`${gameData.name} is currently locked!`);
                    console.log(`${gameData.name} is locked. Scene: ${gameData.sceneKey}`);
                }
            });

            container.on('pointerover', () => {
                 if (gameImage instanceof Phaser.GameObjects.Image) {
                    if (gameData.status === 'available') gameImage.setTint(0xDDDDDD);
                    else gameImage.setTint(0xAAAAAA);
                 }
            });
            container.on('pointerout', () => {
                 if (gameImage instanceof Phaser.GameObjects.Image) {
                    gameImage.clearTint();
                 }
            });

            this.gameItems.add(container);
        });

        EventBus.emit('current-scene-ready', this);
    }
}
