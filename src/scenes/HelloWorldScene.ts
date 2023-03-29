import Phaser from 'phaser'
import { Imgs, PlayerView, Sounds } from '~/common/images.enum';

export default class HelloWorldScene extends Phaser.Scene
{
    private platforms?: Phaser.Physics.Arcade.StaticGroup;
    private player?: Phaser.Physics.Arcade.Sprite;
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private stars?: Phaser.Physics.Arcade.Group;
    private bombs?: Phaser.Physics.Arcade.Group;
    private scoreText?: Phaser.GameObjects.Text;
    private gameOverText?: Phaser.GameObjects.Text;
    private starCollectedS?: Phaser.Sound.BaseSound;
    private gameOverS?: Phaser.Sound.BaseSound;
    private score = 0;
    private gameOver = false;
    
	constructor()
	{
		super('hello-world');
	}

	preload() {
        this.load.image(Imgs.SKY, 'assets/sky.png');
        this.load.image(Imgs.GROUND, 'assets/platform.png');
        this.load.image(Imgs.STAR, 'assets/star.png');
        this.load.image(Imgs.BOMB, 'assets/bomb.png');
        this.load.audio(Sounds.STAR, ['assets/sounds/star.mp3']);
        this.load.audio(Sounds.GAME_OVER, ['assets/sounds/game-over.mp3']);
        this.load.spritesheet(Imgs.DUDE, 'assets/dude.png', { 
            frameWidth: 32, frameHeight: 48
        });
    }

    create() {
        this.starCollectedS = this.sound.add(Sounds.STAR, { loop: false });
        this.gameOverS = this.sound.add(Sounds.GAME_OVER, { loop: false });
        this.add.image(400, 300, Imgs.SKY);
        
        this.platforms = this.physics.add.staticGroup();
        (<Phaser.Physics.Arcade.Sprite>this.platforms.create(400, 568, Imgs.GROUND))
            .setScale(2)
            .refreshBody();
        this.platforms.create(600, 400, Imgs.GROUND);
        this.platforms.create(50, 250, Imgs.GROUND);
        this.platforms.create(750, 220, Imgs.GROUND);
        this.player = this.physics.add.sprite(100, 450, Imgs.DUDE);
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);

        this.anims.create({
            key: PlayerView.LEFT,
            frames: this.anims.generateFrameNames(Imgs.DUDE, {
                start: 0, end: 3
            }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: PlayerView.TURN,
            frames: [{ key: Imgs.DUDE, frame: 4 }],
            frameRate: 20
        });

        this.anims.create({
            key: PlayerView.RIGHT,
            frames: this.anims.generateFrameNames(Imgs.DUDE, {
                start: 5, end: 8}
            ),
            frameRate: 10,
            repeat: -1
        });

        this.physics.add.collider(this.player, this.platforms);

        this.cursors = this.input.keyboard.createCursorKeys();

        this.stars = this.physics.add.group({
            key: Imgs.STAR,
            repeat: 11,
            setXY: { x: 12, y: 0, stepX: 70 }
        });

        this.stars.children.iterate( (child) => {
            (<Phaser.Physics.Arcade.Image>child).setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        });

        this.physics.add.collider(this.stars, this.platforms);
        this.physics.add.overlap(this.player, this.stars, this.handleCollectStars, undefined, this);

        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '32px',
            color: '#000'
        });

        this.bombs = this.physics.add.group();
        this.physics.add.collider(this.bombs, this.platforms);
        this.physics.add.collider(this.player, this.bombs, this.handleHitBomb, undefined, this);
    }

    private handleHitBomb(p: Phaser.GameObjects.GameObject, b: Phaser.GameObjects.GameObject) {
        const player = <Phaser.Physics.Arcade.Sprite>p;
        this.physics.pause();
        player.setTint(0xff0000);
        player.anims.play(PlayerView.TURN);
        this.gameOver = true;
        this.gameOverS?.play();
        this.gameOverText = this.add.text(350, 250, 'GAME OVER\npress Space to restart', {
            font: '40px bold',
            color: '#ff0000',
            align: 'center'
        });
        const x = 400 - this.gameOverText.width / 2;
        const y = 300 - this.gameOverText.height / 2;
        this.gameOverText.setX(x);
        this.gameOverText.setY(y);
    }

    private handleCollectStars(p: Phaser.GameObjects.GameObject, s: Phaser.GameObjects.GameObject) {
        const star = <Phaser.Physics.Arcade.Image>s;
        const player = <Phaser.Physics.Arcade.Sprite>p;
        this.starCollectedS?.play();
        star.disableBody(true, true);

        this.score += 10;
        this.scoreText?.setText(`Score: ${this.score}`);

        if (this.stars?.countActive(true) === 0) {
            this.stars.children.iterate(s => {
                const star = <Phaser.Physics.Arcade.Image>s;
                star.enableBody(true, star.x, 0, true, true);
            });

            if (player) {
                const x = <number>player.x < 400 ? 
                Phaser.Math.Between(400, 800):
                Phaser.Math.Between(0, 400);
    
                const bomb: Phaser.Physics.Arcade.Image = this.bombs?.create(x, 16, Imgs.BOMB);
                bomb.setBounce(1);
                bomb.setCollideWorldBounds(true);
                bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
            }
        }
    }

    update() {
        if (this.cursors?.left?.isDown) {
            this.player?.setVelocityX(-160);
            this.player?.anims.play(PlayerView.LEFT, true);
        } else if (this.cursors?.right?.isDown) {
            this.player?.setVelocityX(160);
            this.player?.anims.play(PlayerView.RIGHT, true);
        } else {
            this.player?.setVelocityX(0);
            this.player?.anims.play(PlayerView.TURN, true);
        }

        if (this.cursors?.up?.isDown && this.player?.body.touching.down) {
            this.player?.setVelocityY(-330);
        }

        if (this.cursors?.space?.isDown && this.gameOver) {
            this.scene.restart();
        }
    }
}
