// Snake originally by Patrick OReilly and Richard Davey
// ATP-kartio made this truly awesome

var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'wappumato', { preload: preload, create: create, update: update,render : render });

function preload() {
    game.load.image('startscreen','images/startscreen.png');
    game.load.image('noppa','images/noppa.png');
    game.load.audio('music', 'sounds/POL-rocketman-short.wav');
}

var scoreList = new Firebase('https://brilliant-fire-631.firebaseio.com/scoreList');
var died = false;
var snakeHead; //head of snake sprite
var snakeSection = new Array(); //array of sprites that make the snake body sections
var snakePath = new Array(); //arrary of positions(points) that have to be stored for the path the sections follow
var numSnakeSections = 30; //number of snake body sections
var snakeSpacer = 6; //parameter that sets the spacing between sections
var gameStarted = false;
var r = 128;
var g = 128;
var b = 128;
var scores = 0;

function create() {

    game.physics.startSystem(Phaser.Physics.ARCADE);

    game.world.setBounds(0, 0, 800, 600);

    cursors = game.input.keyboard.createCursorKeys();

    snakeHead = game.add.sprite(400, 300, 'noppa');
    snakeHead.anchor.setTo(0.5, 0.5);

    game.physics.enable(snakeHead, Phaser.Physics.ARCADE);

    //  Init snakeSection array
    for (var i = 1; i <= numSnakeSections-1; i++)
    {
        snakeSection[i] = game.add.sprite(400, 300, 'noppa');
        snakeSection[i].anchor.setTo(0.5, 0.5);
    }

    //  Init snakePath array
    for (var i = 0; i <= numSnakeSections * snakeSpacer; i++)
    {
        snakePath[i] = new Phaser.Point(400, 300);
    }

    var style = { font: "30px Arial", fill: "#ff0044", align: "left" };
    gameScoreText = game.add.text(0, 0, "Pisteitä: 0", style);

    var bmd = game.add.bitmapData(800, 600);

    bmd.ctx.beginPath();
    bmd.ctx.rect(0, 0, 800, 600);
    bmd.ctx.fillStyle = '#000000';
    bmd.ctx.fill();
    blackBackground = game.add.sprite(0, 0, bmd);

    startscreen = game.add.sprite(0, 0, 'startscreen');
    startscreen.inputEnabled = true;
    startscreen.events.onInputDown.add(closeStartscreen);

    music = game.add.audio('music', 1, true);
    music.play();
}

function update() {
    changeBackgroundColor();
    if (gameStarted) {
        if (died) {
            gameOverScreen();
        }
        else {
            gameLoop();
        }

    }
    else {
        startScreen();
    }
}

function changeBackgroundColor() {
    if (r == 255 || r == 0) {
        r = 128;
    }
    if (g == 255 || g == 0) {
        g = 128;
    }
    if (b == 255 || b == 0) {
        b = 128;
    }

    r = r + (Math.random() < 0.5 ? -1 : 1);
    g = g + (Math.random() < 0.5 ? -1 : 1);
    b = b + (Math.random() < 0.5 ? -1 : 1);
    game.stage.backgroundColor = rgbToHex(r, g, b);
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function gameLoop() {

    setSnakeBodyVelocity();

    // Everytime the snake head moves, insert the new location at the start of the array,
    // and knock the last position off the end

    moveSnake();

    checkCollisionToWalls();

    checkCollisionToItself();

    reactToKeyboardEvents();

    function setSnakeBodyVelocity() {
        snakeHead.body.velocity.setTo(0, 0);
        snakeHead.body.angularVelocity = 0;
        snakeHead.body.velocity.copyFrom(game.physics.arcade.velocityFromAngle(snakeHead.angle, 300));
        snakeHead.body.collideWorldBounds = true;
    }

    function moveSnake() {
        var part = snakePath.pop();

        part.setTo(snakeHead.x, snakeHead.y);

        for (var i = 1; i <= numSnakeSections - 1; i++)
        {
            snakeSection[i].x = (snakePath[i * snakeSpacer]).x;
            snakeSection[i].y = (snakePath[i * snakeSpacer]).y;
        }

        snakePath.unshift(part);
    }

    function checkCollisionToWalls() {
        if (snakeHead.x > game.world.bounds.width -25 || snakeHead.x < 25) {
            died = true;
            setAndShowHighScore();
        } else if (snakeHead.y > game.world.bounds.height -25 || snakeHead.y < 25) {
            died = true;
            setAndShowHighScore();
        }

    }

    function checkCollisionToItself() {
        //game.physics.arcade.collide(snakeHead, snakeSection, function() { died = true });

    }

    function reactToKeyboardEvents() {
        if (cursors.left.isDown)
        {
            snakeHead.body.angularVelocity = -300;
        }
        else if (cursors.right.isDown)
        {
            snakeHead.body.angularVelocity = 300;
        }
    }
}

function startScreen() {
    if (cursors.up.isDown) {
        closeStartscreen();
    }
}

function closeStartscreen() {
    gameStarted = true;
    blackBackground.visible = false;
    startscreen.visible = false;
}

function gameOverScreen() {

}

function setAndShowHighScore() {
    var playerName = prompt("Anna sun nimi niin saadaan vähän high skooreja tonne systeemiin.");
    if (!playerName) return;

    // pisteiden kirjoittaminen Firebaseen
    var playerScoreRef = scoreList.child(playerName);
    playerScoreRef.setWithPriority({name : playerName, score : 1000}, 1000);

    // luetaan Firebasesta viimeiset viisi pistemäärää
    scoreTen = scoreList.endAt().limit(10);
    scoreTen.once('value', function(data) {
        var index = 0;
        // datasta saa ulos selkokielistä dadaa .val()-komennolla
        data.forEach(function(topEntry) {
            // koska paras tulos on vikana, piirretÃ¤Ã¤n lista alhaalta ylÃ¶s
            //layer.add(new Kinetic.Text({x: 325, y: 325-30*index, text: topEntry.child('name').val(), fontSize: 18, fontFamily: 'Helvetica', fill: 'black'}));
            //layer.add(new Kinetic.Text({x: 550, y: 325-30*index, text: topEntry.child('score').val(), fontSize: 18, fontFamily: 'Helvetica', fill: 'black'}));
            //index++;
        });
    });

    //layer.add(new Kinetic.Text({x: 310, y: 100, text: 'Sait yhteensÃ¤ ' + totalScore + ' pistettÃ¤!', fontSize: 24, fontFamily: 'Helvetica', fill: 'black'}));
    //layer.add(new Kinetic.Text({x: 325, y: 175, text: 'Patekin tulevaisuuspelin TOP10', fontSize: 19, fontFamily: 'Helvetica', fill: 'black'}));
}

function addOneScore() {
    scores += 1;
    gameScoreText.text = "Pisteitä: " + scores;
}

function render() {

}