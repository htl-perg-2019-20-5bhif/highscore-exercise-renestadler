import {
  Scene,
  Types,
  CANVAS,
  Game,
  Physics,
  Input,
  GameObjects
} from "phaser";
import { Spaceship, Direction } from "./spaceship";
import { Bullet } from "./bullet";
import { Meteor } from "./meteor";
import { Highscore } from "./Highscore";
import { HighscoreDto } from "./HighscoreDto";

/**
 * Space shooter scene
 *
 * Learn more about Phaser scenes at
 * https://photonstorm.github.io/phaser3-docs/Phaser.Scenes.Systems.html.
 */
let captchaToken = "";

class ShooterScene extends Scene {
  private spaceShip: Spaceship;
  private meteors: Physics.Arcade.Group;
  private bullets: Physics.Arcade.Group;
  private points: GameObjects.Text;

  private bulletTime = 0;
  private meteorTime = 0;

  private cursors: Types.Input.Keyboard.CursorKeys;
  private spaceKey: Input.Keyboard.Key;
  private isGameOver = false;
  private hits = 0;

  preload() {
    // Preload images so that we can use them in our game
    this.load.image("space", "images/deep-space.jpg");
    this.load.image("bullet", "images/scratch-laser.png");
    this.load.image("ship", "images/scratch-spaceship.png");
    this.load.image("meteor", "images/scratch-meteor.png");
  }

  create() {
    if (this.isGameOver) {
      return;
    }

    //  Add a background
    this.add
      .tileSprite(
        0,
        0,
        this.game.canvas.width,
        this.game.canvas.height,
        "space"
      )
      .setOrigin(0, 0);

    this.points = this.add.text(
      this.game.canvas.width * 0.1,
      this.game.canvas.height * 0.1,
      "0",
      { font: "32px Arial", fill: "#ff0044", align: "left" }
    );

    // Create bullets and meteors
    this.bullets = this.physics.add.group({
      classType: Bullet,
      maxSize: 10,
      runChildUpdate: true
    });
    this.meteors = this.physics.add.group({
      classType: Meteor,
      maxSize: 20,
      runChildUpdate: true
    });

    // Add the sprite for our space ship.
    this.spaceShip = new Spaceship(this);
    this.physics.add.existing(this.children.add(this.spaceShip));

    // Position the spaceship horizontally in the middle of the screen
    // and vertically at the bottom of the screen.
    this.spaceShip.setPosition(
      this.game.canvas.width / 2,
      this.game.canvas.height * 0.9
    );

    // Setup game input handling
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.addCapture([" "]);
    this.spaceKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.SPACE);

    this.physics.add.collider(
      this.bullets,
      this.meteors,
      (bullet: Bullet, meteor: Meteor) => {
        if (meteor.active && bullet.active) {
          this.points.setText((++this.hits).toString());
          meteor.kill();
          bullet.kill();
        }
      },
      null,
      this
    );
    this.physics.add.collider(
      this.spaceShip,
      this.meteors,
      this.gameOver,
      null,
      this
    );
  }

  update(_, delta: number) {
    // Move ship if cursor keys are pressed
    if (this.cursors.left.isDown) {
      this.spaceShip.move(delta, Direction.Left);
    } else if (this.cursors.right.isDown) {
      this.spaceShip.move(delta, Direction.Right);
    }

    if (this.spaceKey.isDown) {
      this.fireBullet();
    }

    this.handleMeteors();
  }

  fireBullet() {
    if (this.time.now > this.bulletTime) {
      // Find the first unused (=unfired) bullet
      const bullet = this.bullets.get() as Bullet;
      if (bullet) {
        bullet.fire(this.spaceShip.x, this.spaceShip.y);
        this.bulletTime = this.time.now + 100;
      }
    }
  }

  handleMeteors() {
    // Check if it is time to launch a new meteor.
    if (this.time.now > this.meteorTime) {
      // Find first meteor that is currently not used
      const meteor = this.meteors.get() as Meteor;
      if (meteor) {
        meteor.fall();
        this.meteorTime = this.time.now + 500 + 1000 * Math.random();
      }
    }
  }

  resizeGame() {
    const height = window.outerHeight;
    const width = window.outerWidth;
    this.scale.setGameSize(width, height);
  }

  gameOver() {
    this.isGameOver = true;

    this.bullets.getChildren().forEach((b: Bullet) => b.kill());
    this.meteors.getChildren().forEach((m: Meteor) => m.kill());
    this.spaceShip.kill();

    // Display "game over" text
    const text = this.add.text(
      this.game.canvas.width / 2,
      this.game.canvas.height / 2,
      "Game Over :-(",
      { font: "65px Arial", fill: "#ff0044", align: "center" }
    );
    text.setOrigin(0.5, 0.5);
    this.resizeGame();
    this.scene.start("HighscoreScene", { score: this.hits });
  }
}

class InputPanel extends Phaser.Scene {
  chars = [
    ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
    ["K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"],
    ["U", "V", "W", "X", "Y", "Z", ".", "-", "<", ">"]
  ];

  cursor = new Phaser.Math.Vector2();

  text;
  block;

  name = "";
  charLimit = 3;
  constructor() {
    super({ key: "InputPanel", active: false });
  }

  create() {
    const text = this.add.bitmapText(
      130,
      50,
      "arcade",
      "ABCDEFGHIJ\n\nKLMNOPQRST\n\nUVWXYZ.-"
    );

    text.setLetterSpacing(20);
    text.setInteractive();

    this.add.image(text.x + 430, text.y + 148, "rub");
    this.add.image(text.x + 482, text.y + 148, "end");

    this.block = this.add.image(text.x - 10, text.y - 2, "block").setOrigin(0);

    this.text = text;

    this.input.keyboard.on("keyup_LEFT", this.moveLeft, this);
    this.input.keyboard.on("keyup_RIGHT", this.moveRight, this);
    this.input.keyboard.on("keyup_UP", this.moveUp, this);
    this.input.keyboard.on("keyup_DOWN", this.moveDown, this);
    this.input.keyboard.on("keyup_ENTER", this.pressKey, this);
    this.input.keyboard.on("keyup_SPACE", this.pressKey, this);
    this.input.keyboard.on("keyup", this.anyKey, this);

    text.on("pointermove", this.moveBlock, this);
    text.on("pointerup", this.pressKey, this);

    this.tweens.add({
      targets: this.block,
      alpha: 0.2,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      duration: 350
    });
  }

  moveBlock(pointer, x, y) {
    const cx = Phaser.Math.Snap.Floor(x, 52, 0, true);
    const cy = Phaser.Math.Snap.Floor(y, 64, 0, true);
    const char = this.chars[cy][cx];

    this.cursor.set(cx, cy);

    this.block.x = this.text.x - 10 + cx * 52;
    this.block.y = this.text.y - 2 + cy * 64;
  }

  moveLeft() {
    if (this.cursor.x > 0) {
      this.cursor.x--;
      this.block.x -= 52;
    } else {
      this.cursor.x = 9;
      this.block.x += 52 * 9;
    }
  }

  moveRight() {
    if (this.cursor.x < 9) {
      this.cursor.x++;
      this.block.x += 52;
    } else {
      this.cursor.x = 0;
      this.block.x -= 52 * 9;
    }
  }

  moveUp() {
    if (this.cursor.y > 0) {
      this.cursor.y--;
      this.block.y -= 64;
    } else {
      this.cursor.y = 2;
      this.block.y += 64 * 2;
    }
  }

  moveDown() {
    if (this.cursor.y < 2) {
      this.cursor.y++;
      this.block.y += 64;
    } else {
      this.cursor.y = 0;
      this.block.y -= 64 * 2;
    }
  }

  anyKey(event) {
    //  Only allow A-Z . and -

    let code = event.keyCode;

    if (code === Phaser.Input.Keyboard.KeyCodes.PERIOD) {
      this.cursor.set(6, 2);
      this.pressKey();
    } else if (code === Phaser.Input.Keyboard.KeyCodes.MINUS) {
      this.cursor.set(7, 2);
      this.pressKey();
    } else if (
      code === Phaser.Input.Keyboard.KeyCodes.BACKSPACE ||
      code === Phaser.Input.Keyboard.KeyCodes.DELETE
    ) {
      this.cursor.set(8, 2);
      this.pressKey();
    } else if (
      code >= Phaser.Input.Keyboard.KeyCodes.A &&
      code <= Phaser.Input.Keyboard.KeyCodes.Z
    ) {
      code -= 65;

      const y = Math.floor(code / 10);
      const x = code - y * 10;

      this.cursor.set(x, y);
      this.pressKey();
    }
  }

  pressKey() {
    const x = this.cursor.x;
    const y = this.cursor.y;
    const nameLength = this.name.length;

    this.block.x = this.text.x - 10 + x * 52;
    this.block.y = this.text.y - 2 + y * 64;

    if (x === 9 && y === 2 && nameLength > 0) {
      //  Submit
      this.events.emit("submitName", this.name);
    } else if (x === 8 && y === 2 && nameLength > 0) {
      //  Rub
      this.name = this.name.substr(0, nameLength - 1);

      this.events.emit("updateName", this.name);
    } else if (this.name.length < this.charLimit) {
      //  Add
      this.name = this.name.concat(this.chars[y][x]);

      this.events.emit("updateName", this.name);
    }
  }
}

class Starfield extends Phaser.Scene {
  stars: GameObjects.Blitter;

  distance = 300;
  speed = 250;

  max = 500;
  xx = [];
  yy = [];
  zz = [];

  constructor() {
    super({ key: "Starfield" });
  }

  preload() {
    this.load.image("star", "assets/demoscene/star4.png");
  }

  create() {
    //  Do this, otherwise this Scene will steal all keyboard input
    this.input.keyboard.enabled = false;

    this.stars = this.add.blitter(0, 0, "star");

    for (let i = 0; i < this.max; i++) {
      this.xx[i] = Math.floor(Math.random() * 800) - 400;
      this.yy[i] = Math.floor(Math.random() * 600) - 300;
      this.zz[i] = Math.floor(Math.random() * 1700) - 100;

      const perspective = this.distance / (this.distance - this.zz[i]);
      const x = 400 + this.xx[i] * perspective;
      const y = 300 + this.yy[i] * perspective;

      this.stars.create(x, y);
    }
  }

  update(time, delta) {
    for (let i = 0; i < this.max; i++) {
      const perspective = this.distance / (this.distance - this.zz[i]);
      const x = 400 + this.xx[i] * perspective;
      const y = 300 + this.yy[i] * perspective;

      this.zz[i] += this.speed * (delta / 1000);

      if (this.zz[i] > 300) {
        this.zz[i] -= 600;
      }

      const bob = this.stars.children.list[i];

      bob.x = x;
      bob.y = y;
    }
  }
}

class HighscoreScene extends Phaser.Scene {
  playerText: GameObjects.BitmapText;
  score: number;
  highscores: Highscore[];
  enterNameTxt: GameObjects.BitmapText;
  apiUrl = "http://www.highscoresample.azurewebsites.net";
  initials: string;

  constructor() {
    super("HighscoreScene");
  }

  init(data) {
    this.score = data.score;
  }

  preload() {
    this.load.image("block", "images/block.png");
    this.load.image("rub", "images/rub.png");
    this.load.image("end", "images/end.png");

    this.load.bitmapFont("arcade", "fonts/arcade.png", "fonts/arcade.xml");
  }

  async create() {
    this.highscores = await this.getHighscoresFromAPI();
    const rank = this.getRank(this.highscores);
    const formattedRank = this.formatRank(rank);
    const formattedScore = this.formatScore(`${this.score}`, 5);
    this.add
      .bitmapText(100, 260, "arcade", "RANK  SCORE   NAME")
      .setTint(0xff00ff);
    this.enterNameTxt = this.add
      .bitmapText(100, 310, "arcade", `${formattedRank}   ${formattedScore}`)
      .setTint(0xff0000);

    this.playerText = this.add
      .bitmapText(580, 310, "arcade", "")
      .setTint(0xff0000);

    //  Do this, otherwise this Scene will steal all keyboard input
    this.input.keyboard.enabled = false;

    this.scene.launch("InputPanel");

    const panel = this.scene.get("InputPanel");

    //  Listen to events from the Input Panel scene
    panel.events.on("updateName", this.updateName, this);
    panel.events.on("submitName", this.submitName, this);
  }

  formatRank(rank: number): string {
    let extension = "TH";
    if (rank === 1) {
      extension = "ST";
    } else if (rank === 2) {
      extension = "ND";
    } else if (rank === 3) {
      extension = "RD";
    }
    return `${rank}${extension}`;
  }

  getRank(highscores: Highscore[]) {
    const ownHighscore = this.score;
    highscores.forEach((highscore, index) => {
      if (ownHighscore > highscore.score) {
        return index + 1;
      }
    });
    return highscores.length + 1;
  }

  formatScore(score: string, chars: number): string {
    if (score.length < chars) {
      score = `0${score}`;
      score = this.formatScore(score, chars);
    }
    return score;
  }

  async saveHighscore(score: number, initials: string) {
    const highscore: Highscore = { score: score, initials: initials };
    const highscoreDto: HighscoreDto = {
      highscore: highscore,
      captcha: captchaToken
    };
    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(highscoreDto)
    });
    console.log(response);
  }

  async getHighscoresFromAPI(): Promise<Highscore[]> {
    const highscores: Highscore[] = [{ initials: "MH", score: 10 }];
    const response = await fetch(this.apiUrl);
    console.log(response);
    /*const highscores = await response.json();*/
    return Promise.resolve(highscores);
  }

  async submitName() {
    this.saveHighscore(this.score, this.initials);
    this.highscores = await this.getHighscoresFromAPI();

    const defaultY = 310;
    const spacing = 50;
    this.scene.stop("InputPanel");
    this.enterNameTxt.destroy();
    this.playerText.destroy();
    this.highscores.forEach((highscore, index) => {
      console.log("asfd");
      let color = 0x00bfff;
      switch (index % 5) {
        case 0:
          color = 0xff8200;
          break;
        case 1:
          color = 0xffff00;
          break;
        case 2:
          color = 0x00ff00;
          break;
        case 3:
          color = 0x00ff00;
          break;
        case 4:
          color = 0x00bfff;
          break;
      }
      const formattedRank = this.formatRank(index + 1);
      const initials = highscore.initials;
      const score = highscore.score;
      const formattedScore = this.formatScore(`${score}`, 5);
      const yOffset = defaultY + spacing * index;
      this.add
        .bitmapText(
          100,
          yOffset,
          "arcade",
          `${formattedRank}   ${formattedScore}    ${initials}`
        )
        .setTint(0x00bfff);
    });

    /*this.add
      .bitmapText(100, 360, "arcade", "2ND   40000    ANT")
      .setTint(0xff8200);
    this.add
      .bitmapText(100, 410, "arcade", "3RD   30000    .-.")
      .setTint(0xffff00);
    this.add
      .bitmapText(100, 460, "arcade", "4TH   20000    BOB")
      .setTint(0x00ff00);
    this.add
      .bitmapText(100, 510, "arcade", "5TH   10000    ZIK")
      .setTint(0x00bfff);*/
  }

  updateName(name) {
    this.initials = name;
    this.playerText.setText(name);
  }
}

function startGame() {
  const config = {
    type: Phaser.AUTO,
    width: 512,
    height: 512,
    pixelArt: true,
    scene: [ShooterScene, HighscoreScene, InputPanel],
    physics: { default: "arcade" },
    audio: { noAudio: true }
  };

  new Game(config);
}

export function onCaptchaCallback(token: string) {
  captchaToken = token;
  document.getElementById("captchaForm").remove();
  startGame();
}

//@ts-ignore
window.onCaptchaCallback = onCaptchaCallback;
