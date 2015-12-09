(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Vector = require("./vector.js");
function Box(x, y, w, h, type) {
    if(isNaN(x) || isNaN(y))
        console.error("Box x or y value is NaN");
    if(isNaN(w) || isNaN(h))
        console.error("Box width or height is NaN");

    this.position = [x, y];
    this.velocity = [0, 0];
    this.acceleration = [0, 0];

    this.prevPosition = [x, y];
    this.friction = 1;

    this.width = w;
    this.height = h;
    this.settled = false;
    this.type = type;
    this.color;
    if(this.type == Box.BoxTypeEnum.HEALTH) {
        this.color = "#ff8888";
    } else if(this.type == Box.BoxTypeEnum.METEOR) {
        this.color = "#AAAAAA";
    } else if(this.type == Box.BoxTypeEnum.NORMAL) {
        this.color = "#ffffff";
    }

    if(typeof this.color == 'undefined')  {
        console.error("Box color is undefined");
    }
}

Box.BoxTypeEnum = {
    HEALTH: "HEALTH",
    METEOR: "METEOR",
    NORMAL: "NORMAL"
}

Box.prototype.getLeftEdge = function() {
    return this.position[0] - this.width / 2;
}

Box.prototype.getRightEdge = function() {
    return this.position[0] + this.width / 2;
}

Box.prototype.getTopEdge = function() {
    return this.position[1] - this.height / 2;
}

Box.prototype.getBottomEdge = function() {
    return this.position[1] + this.height / 2;
}

Box.prototype.touching = function(box) {
    var thisCenter = [this.position[0], this.position[1]];
    var boxCenter = [box.position[0], box.position[1]];
    var result = (Math.abs(thisCenter[0] - boxCenter[0]) * 2 < this.width + box.width) && 
                 (Math.abs(thisCenter[1] - boxCenter[1]) * 2 < this.height + box.height);
    return result;
}

Box.prototype.update = function() {
    this.prevPosition = this.position;

    this.velocity = Vector.add(this.velocity, this.acceleration);
    this.velocity = Vector.multiply(this.velocity, this.friction);
    this.position = Vector.add(this.position, this.velocity);
}

Box.prototype.draw = function(context) {
    var prevFill = context.fillStyle;
    context.fillStyle = this.color;
    context.fillRect(this.position[0] - this.width / 2, this.position[1] - this.height / 2, this.width, this.height);
    context.fillStyle = prevFill;
}

Box.prototype.checkValidity = function() {
    if(isNaN(this.acceleration[0]) || isNaN(this.acceleration[1])) {
        console.error("Box acceleration is NaN");
        return false;
    }
    if(isNaN(this.velocity[0]) || isNaN(this.velocity[1])) {
        console.error("Box velocity is NaN");
        return false;
    }
    if(isNaN(this.position[0]) || isNaN(this.position[1])) {
        console.error("Box position is NaN");
        return false;
    }


    if(isNaN(this.width) || isNaN(this.height)) {
        console.error("Box dimensions are NaN");
        return false;
    }

    return true;
}

module.exports = Box;

},{"./vector.js":4}],2:[function(require,module,exports){
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

},{"./box.js":1,"./timer.js":3,"./vector.js":4}],3:[function(require,module,exports){
function Timer(condition, timerEvent) {

    //time holds the current time for the timer
    this.time = 0;
    //Starting the timer
    this.start();

    //condition and timerEvent are functions
    //if this.condition(t) == true then this.timerEvent()
    if(Timer.checkConditionAndEvent(condition, timerEvent)) {
        this.conditions = [condition];
        this.timerEvents = [timerEvent];
    } else {
        this.conditions = [];
        this.timerEvents = [];
    }
}

Timer.checkConditionAndEvent = function(condition, timerEvent) {
    if(typeof condition != 'function') {
        console.error("Condition", condition, "is not a function.");
        return false;
    }

    if(typeof timerEvent != 'function') {
        console.error("TimerEvent", timerEvent, "is not a function.");
        return false;
    }
    return true;
}

Timer.handleTimers = function() {
    if(typeof Timer.timers != 'undefined') {
        for(i in Timer.timers) {
            if(typeof Timer.timers[i] == 'undefined')
                Timer.timers.splice(i, 1);
            if(Timer.timers[i].timerIndex != i)
                Timer.timers[i].timerIndex = parseInt(i)
        }

        for(i in Timer.timers)
            Timer.timers[i].update();
    }
}

Timer.prototype.addTimerEvent = function(condition, timerEvent) {
    if(!Timer.checkConditionAndEvent(condition, timerEvent))
        return;

    this.conditions.push(condition);
    this.timerEvents.push(timerEvent);
}

Timer.prototype.update = function() {
    this.time++;
    for(i in this.conditions) {
        if(this.conditions[i](this.time))
            this.timerEvents[i]();
    }
}

Timer.prototype.reset = function() {
    this.time = 0;
}

Timer.prototype.stop = function() {
    Timer.timers.splice(this.timerIndex, 1);
    delete Timer.timers[this.timerIndex];
}

Timer.prototype.start = function() {
    if(typeof Timer.timers == 'undefined')
        Timer.timers = [];

    this.timerIndex = Timer.timers.length;

    Timer.timers.push(this);
}

module.exports = Timer;

},{}],4:[function(require,module,exports){
function Vector() {}

Vector.add = function(v1, v2) {
    return [v1[0] + v2[0], v1[1] + v2[1]];
}

Vector.multiply = function(vector, scalar) {
    return [vector[0] * scalar, vector[1] * scalar];
}

Vector.normal = function(vector) {
    return Vector.multiply(vector, 1 / Vector.magnitude(vector));
}

Vector.magnitude = function(vector) {
    return Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
}

module.exports = Vector;

},{}]},{},[2]);
