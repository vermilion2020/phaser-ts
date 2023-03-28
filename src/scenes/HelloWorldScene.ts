import Phaser from 'phaser'

export default class HelloWorldScene extends Phaser.Scene
{
    private platforms?: Phaser.Physics.Arcade.StaticGroup;
    private player?: Phaser.Physics.Arcade.Sprite;
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private stars?: Phaser.Physics.Arcade.Group;
    private bombs?: Phaser.Physics.Arcade.Group;
    private scoreText?: Phaser.GameObjects.Text;
    private score = 0;
    private gameOver = false;
    
	constructor()
	{
		super('hello-world');
	}

	preload() {
        this.load.image('sky', 'assets/sky.png');
        this.load.image('ground', 'assets/platform.png');
        this.load.image('star', 'assets/star.png');
        this.load.image('bomb', 'assets/bomb.png');
        this.load.spritesheet('dude', 'assets/dude.png', { 
            frameWidth: 32, frameHeight: 48
        });
    }

    create() {
        this.add.image(400, 300, 'sky');
        
        this.platforms = this.physics.add.staticGroup();
        (<Phaser.Physics.Arcade.Sprite>this.platforms.create(400, 568, 'ground'))
            .setScale(2)
            .refreshBody();
        this.platforms.create(600, 400, 'ground');
        this.platforms.create(50, 250, 'ground');
        this.platforms.create(750, 220, 'ground');
        this.player = this.physics.add.sprite(100, 450, 'dude');
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);

        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNames('dude', {
                start: 0, end: 3
            }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'turn',
            frames: [{ key: 'dude', frame: 4 }],
            frameRate: 20
        });

        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNames('dude', {
                start: 5, end: 8}
            ),
            frameRate: 10,
            repeat: -1
        });

        this.physics.add.collider(this.player, this.platforms);

        this.cursors = this.input.keyboard.createCursorKeys();

        this.stars = this.physics.add.group({
            key: 'star',
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

    private handleHitBomb(player: Phaser.GameObjects.GameObject, b: Phaser.GameObjects.GameObject) {
        this.physics.pause();
        this.player?.setTint(0xff0000);
        this.player?.anims.play('turn');
        this.gameOver = true;
    }

    private handleCollectStars(player: Phaser.GameObjects.GameObject, s: Phaser.GameObjects.GameObject) {
        const star = <Phaser.Physics.Arcade.Image>s;
        star.disableBody(true, true);

        this.score += 10;
        this.scoreText?.setText(`Score: ${this.score}`);

        if (this.stars?.countActive(true) === 0) {
            this.stars.children.iterate(s => {
                const star = <Phaser.Physics.Arcade.Image>s;
                star.enableBody(true, star.x, 0, true, true);
            });

            if (this.player) {
                const x = <number>this.player.x < 400 ? 
                Phaser.Math.Between(400, 800):
                Phaser.Math.Between(0, 400);
    
                const bomb: Phaser.Physics.Arcade.Image = this.bombs?.create(x, 16, 'bomb');
                bomb.setBounce(1);
                bomb.setCollideWorldBounds(true);
                bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
            }
        }
    }

    update() {
        if (this.cursors?.left?.isDown) {
            this.player?.setVelocityX(-160);
            this.player?.anims.play('left', true);
        } else if (this.cursors?.right?.isDown) {
            this.player?.setVelocityX(160);
            this.player?.anims.play('right', true);
        } else {
            this.player?.setVelocityX(0);
            this.player?.anims.play('turn', true);
        }

        if (this.cursors?.up?.isDown && this.player?.body.touching.down) {
            this.player?.setVelocityY(-330);
        }
    }
}
