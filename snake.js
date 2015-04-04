// Snake originally by Patrick OReilly and Richard Davey
// ATP-kartio made this truly awesome

var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'wappumato', { preload: preload, create: create, update: update,render : render });

function preload() {
    game.load.image('startscreen','images/startscreen.png');
    game.load.image('noppa','images/noppa.png');
    game.load.audio('music', 'sounds/POL-rocketman-short.wav');

    game.load.image('itemi1','images/apy.jpg');
    game.load.image('itemi2','images/amfi.jpg');
    game.load.image('itemi3','images/igristoje.jpg');
    game.load.image('itemi4','images/ilmapallot.jpg');
    game.load.image('itemi5','images/jaloviina.jpg');
    game.load.image('itemi6','images/kaljashotti.jpg');
    game.load.image('itemi7','images/kroketti.jpg');
    game.load.image('itemi8','images/serpentiini.jpg');
    game.load.image('itemi9','images/teekkaribileet.jpg');
}

var scoreList = new Firebase('https://brilliant-fire-631.firebaseio.com/scoreList');
var died = false;
var snakeHead; //head of snake sprite
var snakeSection = new Array(); //array of sprites that make the snake body sections
var snakePath = new Array(); //arrary of positions(points) that have to be stored for the path the sections follow
var numSnakeSections = 30; //number of snake body sections
var snakeSpacer = 6; //parameter that sets the spacing between sections
var gameStarted = false;
var r = 0;
var g = 128;
var b = 255;
var goRup = true;
var goGup = false;
var goBup = false;
var scores = 0;
var spawnedItem = null;
var velocity = 270;

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
        game.physics.enable(snakeSection[i], Phaser.Physics.ARCADE);
    }

    //  Init snakePath array
    for (var i = 0; i <= numSnakeSections * snakeSpacer; i++)
    {
        snakePath[i] = new Phaser.Point(400, 300);
    }

    var style = { font: "30px Arial", fill: "#ff0044", align: "left" };
    gameScoreText = game.add.text(0, 0, "Pisteitä: 0", style);

    spawnNewItem();

    var bmd = game.add.bitmapData(800, 600);

    bmd.ctx.beginPath();
    bmd.ctx.rect(0, 0, 800, 600);
    bmd.ctx.fillStyle = '#000000';
    bmd.ctx.fill();

    blackBackground = game.add.sprite(0, 0, bmd);
    blackBackground.inputEnabled = true;
    blackBackground.events.onInputDown.add(reloadPageIfGameEnded);

    startscreen = game.add.sprite(0, 0, 'startscreen');
    startscreen.inputEnabled = true;
    startscreen.events.onInputDown.add(closeStartscreen);

    music = game.add.audio('music', 1, true);
    music.play();

    var scoreTextStyle = { font: "15px Arial", fill: "#ff0044", align: "left" };
    scoreText = game.add.text(100, 100, "", scoreTextStyle);
    scoreText.visible = false;
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
    if (r >= 255) {
        goRup = false;
    } else if (r <= 0) {
        goRup = true;
    }
    if (g >= 255) {
        goGup = false;
    } else if (g <= 0) {
        goGup = true;
    }
    if (b >= 255) {
        goBup = false;
    } else if (b <= 0) {
        goBup = true;
    }


    goRup ? r++ : r--;
    goGup ? g++ : g--;
    goBup ? b++ : b--;

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

    checkCollisionToItem();

    reactToKeyboardEvents();

    function checkCollisionToItem() {
        game.physics.arcade.overlap(snakeHead, spawnedItem, reactToItemCollision);
    }


    function setSnakeBodyVelocity() {
        snakeHead.body.velocity.setTo(0, 0);
        snakeHead.body.angularVelocity = 0;
        snakeHead.body.velocity.copyFrom(game.physics.arcade.velocityFromAngle(snakeHead.angle, velocity));
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
            reactToCollisionToWallOrSelf();
        } else if (snakeHead.y > game.world.bounds.height -25 || snakeHead.y < 25) {
            reactToCollisionToWallOrSelf();
        }

    }

    function checkCollisionToItself() {
        game.physics.arcade.collide(snakeHead, snakeSection, reactToCollisionToWallOrSelf);

    }

    function reactToKeyboardEvents() {
        if (cursors.left.isDown)
        {
            snakeHead.body.angularVelocity = -velocity;
        }
        else if (cursors.right.isDown)
        {
            snakeHead.body.angularVelocity = velocity;
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

function setAndShowHighScore(askNicely) {
    var askNiceText = askNicely ? "Laitapa se nimi oikeasti! Ei täällä huijata." : "";
    var playerName = prompt("Anna sun nimi niin saadaan vähän high skooreja tonne systeemiin. " + askNiceText);
    if (!playerName) {
        setAndShowHighScore(true);
        return;
    }

    // pisteiden kirjoittaminen Firebaseen
    var playerScoreRef = scoreList.child(playerName);
    playerScoreRef.setWithPriority({name : playerName, score : scores}, scores);

    blackBackground.visible = true;
    scoreText.visible = true;
    spawnedItem.destroy();

    var text = "Top 10 tulokset:\n\n";
    // luetaan Firebasesta viimeiset viisi pistemäärää
    scoreTen = scoreList.limitToLast(10);
    scoreTen.once('value', function(data) {
        var index = 0;
        // datasta saa ulos selkokielistä dadaa .val()-komennolla
        data.forEach(function(topEntry) {
            // koska paras tulos on vikana, piirretÃ¤Ã¤n lista alhaalta ylÃ¶s
            text += topEntry.child('name').val() + ": " + topEntry.child('score').val() + "\n";

            index += 1;

            if (index == 10) {
                text += "\n Paina jotain niin pääset taas pelaamaan! Jee!";
                scoreText.text = text;
            }
        });
    });



}

function addOneScore() {
    scores += 1;
    gameScoreText.text = "Pisteitä: " + scores;
}

function spawnNewItem() {
    if (spawnedItem) {
        spawnedItem.destroy();
    }

    var itemiIndex = Math.floor(Math.random() * 9) + 1;
    spawnedItem = game.add.sprite(parseInt(Math.random() * 700), parseInt(Math.random() * 500), 'itemi' + itemiIndex);
    game.physics.enable(spawnedItem, Phaser.Physics.ARCADE);
}

function reactToItemCollision() {
    addOneScore();
    spawnNewItem();
    velocity += 7;
}

function reactToCollisionToWallOrSelf() {
    died = true;
    setAndShowHighScore();
}

function reloadPageIfGameEnded() {
    console.log("jes");
    if (died) window.location.reload();
}

function render() {

}