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
