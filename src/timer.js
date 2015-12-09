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
