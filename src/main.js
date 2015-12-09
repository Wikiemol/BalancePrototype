//Includes
var Vector = require("./vector.js");
var Box = require("./box.js");
var Timer = require("./timer.js");

window.addEventListener('load', onLoad, false);

var PLAYER_ACCELERATION = 3;
var GRAVITY             = 0.1;
var stackFreeze            = false;

var canvas              = null;
var ctx                 = null;
var controlledBox       = null;
var mouseX              = null;
var mouseY              = null;
var nextX               = null;
var nextWidth           = null;

//This will be the stack of boxes (box.js) in order from lowest to highest
//This doesn't include the controlledBox
var boxes = [];

var healthBarWidth = null;
var health = null;
var healthReduceTimer = null;
var gameLoopInterval = null;


function onLoad() {
    canvas = document.getElementById('myCanvas');
    ctx = canvas.getContext('2d');

    //Setting Canvas to window dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    //Getting rid of margins around canvas
    canvas.style.position = "absolute";
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.style.margins = 0;

    //Black Canvas background
    canvas.style.background = "#000000";
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //Creating the box that is controlled by the player
    controlledBox = new Box(canvas.width / 2, canvas.height / 1.03, 200, 10, Box.BoxTypeEnum.NORMAL);
    controlledBox.friction = 0.93;

    //Initializing the mouse position so that the box doesn't
    //immediately start moving
    if(mouseX == null)
        mouseX = controlledBox.position[0];
    if(mouseY == null)
        mouseY = controlledBox.position[1];

    //Adding eventListeners
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('keypress', onKeyPress);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);


    //Health is initialized to the width of the window
    //If a box falls its length is subtracted from the health
    health = canvas.width;
    healthBarWidth = canvas.width;

    //Setting Timers
    var dropBoxTimer = new Timer(function(t) {return t >= 100;}, function() {
        dropNewBox();
        dropBoxTimer.reset();
    });

    //Every other group of ten frames we draw an arrow pointing to the next box
    //This creates a blinking effect
    var arrowBlinkTimer = new Timer(function(t) {return Math.floor(t / 10) % 2 != 0;}, drawArrow);

    healthReduceTimer = new Timer(function(t) {return (health < healthBarWidth)}, reduceHealthBar);
    healthReduceTimer.addTimerEvent(function(t) {return health >= healthBarWidth;}, function() {healthReduceTimer.stop()});
    healthReduceTimer.stop();


    nextWidth = Math.random() * 200 + 10;
    nextX = Math.random() * (canvas.width - nextWidth * 2) + nextWidth;

    gameLoopInterval = setInterval(gameLoop, 33);
}

function onMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
}

function onKeyPress(e) {
    if(e.keyCode == 112) { //p key for pause
        if(gameLoopInterval == null) {
            gameLoopInterval = setInterval(gameLoop, 33);
        } else {
            pause();
        }
    }
        
}

function onKeyDown(e) {
    if(e.keyCode == 32) //space
        stackFreeze = true;
}

function onKeyUp(e) {
    if(e.keyCode == 32)//space
        stackFreeze = false;
}

function pause() {
    clearInterval(gameLoopInterval);
    gameLoopInterval = null;
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    controlledBox.acceleration[0] = (mouseX - controlledBox.position[0]) * 0.008;
    controlledBox.update();
    controlledBox.draw(ctx);

    for(var i = 0; i < boxes.length; i++) {
        var previousBox;

        if(i == 0)
            previousBox = controlledBox;
        else
            previousBox = boxes[i - 1];

        //boxes[i].acceleration = Vector.multiply(boxes[i].acceleration, 0.7);
        boxes[i].update();
        //Collision Detection
        if(boxes[i].touching(previousBox)) {
            boxes[i].acceleration = previousBox.acceleration
            boxes[i].friction = previousBox.friction + (0.999 - previousBox.friction) / 15;

            if(stackFreeze)
                boxes[i].friction = previousBox.friction;

            if(boxes[i].settled == false) {
                boxes[i].velocity = previousBox.velocity;
                boxes[i].settled = true;
            }

            boxes[i].position[1] = previousBox.getTopEdge() - boxes[i].height / 2;
        } else {
            boxes[i].acceleration = [0, GRAVITY * 2];

            if(stackFreeze)
                boxes[i].friction = 0.85;
            else
                boxes[i].friction = 1;
        }

        if(!boxes[i].checkValidity())
            pause();

        if(boxes[i].settled == true)
        {
            var rightCloseness = previousBox.getRightEdge() - boxes[i].getLeftEdge();
            var leftCloseness = boxes[i].getRightEdge() - previousBox.getLeftEdge();
            ctx.fillStyle = "#ff0000";
            if(rightCloseness <= 5 && rightCloseness > 0)
                ctx.fillRect(boxes[i].position[0] + boxes[i].width, boxes[i].getTopEdge(), 10, 20);
            if(leftCloseness <= 5 && leftCloseness > 0)
                ctx.fillRect(boxes[i].position[0] - boxes[i].width, boxes[i].getTopEdge(), 10, 20);
        }
        boxes[i].draw(ctx);

        //If box falls below the screen, reduce health
        if(boxes[i].position[1] > canvas.height) {
            health -= boxes[i].width;
            boxes.splice(i, 1);
            healthReduceTimer.start();
        }

        if(stackFreeze) {
            health -= 0.08;
            healthReduceTimer.start();
        }
    }

    drawHealth();

    Timer.handleTimers();

    if(healthBarWidth <= 0) {
        document.write("Game Over");
        clearInterval(gameLoopInterval);
    }
}

function drawHealth() {
    ctx.fillStyle = "#ff8888";
    ctx.fillRect(0, 0, healthBarWidth, 10);
}

function reduceHealthBar() {
    healthBarWidth -= Math.ceil((healthBarWidth - health) / 20);
}


function dropNewBox() {
    var height = 20;
    var random = Math.random();
    var boxType;
    if(random > 0.2) {
        boxType = Box.BoxTypeEnum.NORMAL;
    } else if(random > 0.1) {
        boxType = Box.BoxTypeEnum.HEALTH;
    } else if(random > 0.0) {
        boxType = Box.BoxTypeEnum.METEOR;
    }

    var b = new Box(nextX, -height, nextWidth, height, boxType);
    b.acceleration = [0, GRAVITY];
    boxes.push(b);

    nextWidth = Math.random() * 50 + 10;
    nextX = Math.random() * (canvas.width - nextWidth * 2) + nextWidth;
}

function drawArrow() {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.strokeStyle = "#ffffff";
    ctx.moveTo(nextX - 10, 20);
    ctx.lineTo(nextX, 10);
    ctx.lineTo(nextX + 10, 20);
    ctx.closePath();
    ctx.fill();
}
