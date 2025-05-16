import { Scene } from 'phaser';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        //  We loaded this image in our Boot Scene, so we can display it here

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512-230, 384, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress: number) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload ()
    {
        //  Load the assets for the game - Replace with your own assets
        this.load.setPath('assets');

        this.load.image('logo', 'logo.png');
        this.load.image('star', 'star.png');

        // Assets for MainMenu game icons
        this.load.image('game_icon_bird', 'logo-games/bird.png');
        this.load.image('game_icon_ant', 'logo-games/ant.png');
        this.load.image('game_icon_penguin', 'logo-games/penguin.png');

        // Assets for PenguinPursuitGameplayScene
        this.load.spritesheet('player', 'PenguinPursuit/Sprite/player.png', {
            frameWidth: 48,
            frameHeight: 48
        });
        this.load.spritesheet('enemy', 'PenguinPursuit/Sprite/enemy.png', {
            frameWidth: 48,
            frameHeight: 48
        });
        this.load.image('fish-1', 'PenguinPursuit/fish-1.png');
        this.load.image('fish-2', 'PenguinPursuit/fish-2.png');
        this.load.image('fish-3', 'PenguinPursuit/fish-3.png');
        this.load.image('fish-4', 'PenguinPursuit/fish-4.png');
        this.load.image('scene-bg', 'PenguinPursuit/bg.png');
        this.load.image('maze-bg', 'PenguinPursuit/maze-bg.png');

        // Assets for SplittingSeedsScene
        this.load.image('splitting-seed', 'SplittingSeeds/seed.png');
        this.load.image('splitting-background', 'SplittingSeeds/background.png');
        this.load.image('splitting-stick', 'SplittingSeeds/stick.png');
        this.load.image('splitting-left-bird', 'SplittingSeeds/bird-left.png');
        this.load.image('splitting-right-bird', 'SplittingSeeds/bird-right.png');
        this.load.audio('splitting-bg-sound', 'SplittingSeeds/sfx/bg-sound.mp3');
        this.load.audio('splitting-check-sound', 'SplittingSeeds/sfx/check-sound.mp3');
        this.load.audio('splitting-seed-sound', 'SplittingSeeds/sfx/seed-sound.mp3');
    }

    create ()
    {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('MainMenu');
    }
}
