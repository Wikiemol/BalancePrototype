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
