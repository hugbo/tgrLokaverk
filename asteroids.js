let canvas;
let gl;

let NumVertices = 36;

let program;
let texture;

let points = [];
let texCoords = [];
let asteroids = [];
let lasers = [];

let xAxis = 0;
let yAxis = 1;
let zAxis = 2;

let axis = 0;
let theta = [0, 0, 0];

let movement = false; // Do we rotate?
let spinX = 0;
let spinY = 0;
let origX;
let origY;

let zDist = -4.0;

let proLoc;
let mvLoc;
let index;
let boundaryBox;

// TEXTURES

let asteroidTexture;
let ufoBodyTexture;
let ufoCockpitTexture;
let laserTexture;

// AUDIO

let explosionSound = new Audio("audio/explosion.wav");
let spaceshipSound = new Audio("audio/Airplane_Rocket_Close.mp3");
let laserSound = new Audio("audio/Laser_Gun.mp3");
let ufoSound = new Audio("audio/Spaceship_Alarm.mp3");

// Varibles for user view
const movementSize = 0.5; // Size of forward/backward step
// How many degrees are added/detracted to heading for each button push
const degreesPerTurn = 10.0;
// Half the height of the bounding asteroid
const boundaryRadius = 10.0;
const playerBoundingRadius = 0.5;

const MAX_HEALTH = 3;

let ufo;

const MIN_UFO_TIME = 5; //seconds
const MAX_UFO_TIME = 15; // seconds

let UFO_INTERVAL = (Math.random() * (MAX_UFO_TIME - MIN_UFO_TIME) + MIN_UFO_TIME) * 1000;


setInterval(function(){
  if (ufo.health == 0) {
    ufo.revive();
  }
}, UFO_INTERVAL)

class Laser {
  constructor(coords, direction) {
    this.coords = coords;
    this.direction = direction;
    this.updateBounds();
  }

  // Moves the laser by dist in current heading
  addMovement(dist){
    this.coords.x += dist * this.coords.x;
    this.coords.y += dist * this.coords.y;
    this.coords.z += dist * this.coords.z;
    this.updateBounds();
  }

  updateBounds() {
      this.bounds = {
          back: this.coords.z - 0.7,
          front: this.coords.z + 0.7,
          top: this.coords.y - 0.2,
          bottom: this.coords.y + 0.2,
          left: this.coords.x - 0.2,
          right: this.coords.x + 0.2
      }
  }
}

class Asteroid {
    constructor(coords, health) {
        this.coords = coords;
        this.health = health;
        this.size = health / MAX_HEALTH;
        this.bounds = this.updateBounds();
        this.speed = this.createRandomSpeed();
        this.direction = this.createRandomDirection();
    };

    get getCoords() {
        return this.coords;
    }

    set updateCoords(coords) {
        this.coords = coords;
    }

    get getSpeed() {
        return this.speed;
    }

    get getDirection() {
        return this.direction;
    }

    get boundingBox() {
        let x = this.coords.x;
        let y = this.coords.y;
        let z = this.coords.z;
        let s = this.size * 0.5;
        return [
            vec3(x - s, y + s, z + s),
            vec3(x + s, y + s, z + s),
            vec3(x - s, y + s, z - s),
            vec3(x + s, y + s, z - s),
            //
            vec3(x - s, y - s, z + s),
            vec3(x + s, y - s, z + s),
            vec3(x - s, y - s, z - s),
            vec3(x + s, y - s, z - s)
        ];
    }

    get radius() {
        return this.size * 0.5;
    }

    createRandomSpeed() {
        let max = 0.02;
        let min = 0.001;

        let dx = Math.random() * (max - min) + min;
        let dy = Math.random() * (max - min) + min;
        let dz = Math.random() * (max - min) + min;

        return {dx: dx, dy: dy, dz: dz};
    }

    createRandomDirection() {
        let prob = 0.5;
        return {
            xdir: Math.random() > prob
                ? 1
                : -1,
            ydir: Math.random() > prob
                ? 1
                : -1,
            zdir: Math.random() > prob
                ? 1
                : -1
        }
    }

    registerHit() {
        if (this.health == 0)
            return;
        this.health--;
        this.size = this.health / MAX_HEALTH;
        this.updateBounds();
    }

    displace(x, y, z) {
        this.coords.x += x;
        this.coords.y += y;
        this.coords.z += z;
        this.updateBounds();
    }

    registerHit() {
        if (this.health == 0)
            return;
        this.health--;
        this.size = this.health / MAX_HEALTH;
        this.updateBounds();
    }

    updateBounds() {
        this.bounds = {
            back: this.coords.z - this.size,
            front: this.coords.z + this.size,
            top: this.coords.y - this.size,
            bottom: this.coords.y + this.size,
            left: this.coords.x - this.size,
            right: this.coords.x + this.size
        }
    }

}

class UFO {
    constructor(coords, health) {
        this.coords = coords;
        this.health = health;
        this.bounds = this.updateBounds();
        this.speed = this.createRandomSpeed();
        this.direction = this.createRandomDirection();
    };

    get getCoords() {
        return this.coords;
    }

    set updateCoords(coords) {
        this.coords = coords;
    }

    get getSpeed() {
        return this.speed;
    }

    get getDirection() {
        return this.direction;
    }

    revive() {
        this.health = 1;
        ufoSound.play();
    }

    createRandomSpeed() {
        let max = 0.002;
        let min = 0.0001;

        let dx = Math.random() * (max - min) + min;
        let dy = Math.random() * (max - min) + min;
        let dz = Math.random() * (max - min) + min;

        return {dx: dx, dy: dy, dz: dz};
    }

    createRandomDirection() {
        let prob = 0.5;
        return {
            xdir: Math.random() > prob
                ? 1
                : -1,
            ydir: Math.random() > prob
                ? 1
                : -1,
            zdir: Math.random() > prob
                ? 1
                : -1
        }
    }

    registerHit() {
        if (this.health == 0)
            return;
        this.health--;
        ufoSound.pause();
    }

    updateBounds() {
        this.bounds = {
            back: this.coords.z - this.size,
            front: this.coords.z + this.size,
            top: this.coords.y - this.size,
            bottom: this.coords.y + this.size,
            left: this.coords.x - this.size,
            right: this.coords.x + this.size
        }
    }
}

// The position variable contains the (x,y,z) co-ordinates of the viewer,
// direction contains the (x,y,z) vector components of the heading and angles
// contains the heading of the viewer where angles[0] is theta and angles[1]
// is phi. boundingBox contains the 8 corners of the box that bounds the player
// and size is the "radius" (half the height) of the bounding box.
class Ship {
    constructor(position, direction, angles, boundingBox, size) {
        this.coords = position;
        this.direction = direction;
        this.angles = angles;
        this.boundingBox = boundingBox;
        this.size = size;
    }

    addToTheta(theta) {
        let tmp = this.angles[0] + theta;
        tmp %= 360.0;
        // Catches cases where normalization would cause an error
        if (tmp == 360.0 || tmp == 0.0)
            tmp += 0.01;
        this.angles[0] = tmp;
        this.recalculateDirection();
    }

    addToPhi(phi) {
        let tmp = (this.angles[1] + phi) % 360.0;
        this.angles[1] = tmp;
        this.recalculateDirection();
    }

    // Moves the viewer by dist in the current heading
    addMovement(dist) {
        this.coords.x += dist * this.direction[0];
        this.coords.y += dist * this.direction[1];
        this.coords.z += dist * this.direction[2];
        for (let i = 0; i < this.boundingBox.length; i++) {
            this.boundingBox[i][0] += dist * this.direction[0];
            this.boundingBox[i][1] += dist * this.direction[1];
            this.boundingBox[i][2] += dist * this.direction[2];
        }
    }

    // Calculate a new direction vector for heading
    recalculateDirection() {
        this.direction[0] = Math.sin(radians(this.angles[0])) * Math.cos(radians(this.angles[1]));
        this.direction[1] = Math.cos(radians(this.angles[0]));
        this.direction[2] = Math.sin(radians(this.angles[0])) * Math.sin(radians(this.angles[1]));
    }

    // Displaces the viewer by x, y, z and moves the bounding box as well
    displace(x, y, z) {
        this.coords.x += x;
        this.coords.y += y;
        this.coords.z += z;
        for (let i = 0; i < this.boundingBox.length; i++) {
            this.boundingBox[i][0] += x;
            this.boundingBox[i][1] += y;
            this.boundingBox[i][2] += z;
        }
    }

    // Fires a laser in the current heading
    shoopDaWhoop(){
      let tmpX = this.coords.x*1.1;
      let tmpY = this.coords.y*1.1;
      let tmpZ = this.coords.z*1.1;
      let tmpCoords = {
        x: tmpZ,
        y: tmpY,
        z: tmpZ
      };
      let tmpDirection = {
        x: this.direction[0],
        y: this.direction[1],
        z: this.direction[2]
      };
      let tmpLaser = new Laser(tmpCoords, tmpDirection);
      console.log(tmpLaser.coords);
      console.log(tmpLaser.direction);
      lasers.push(tmpLaser);
    }

    // getters
    get theta() {
        return this.angles[0];
    }
    get phi() {
        return this.angles[1];
    }
    get positionVector() {
        return vec3(this.coords.x, this.coords.y, this.coords.z);
    }
    // Returns appropriate "eye" vector for use with the lookAt method
    get eyeVector() {
        return vec3(this.coords.x + this.direction[0], this.coords.y + this.direction[1], this.coords.z + this.direction[2]);
    }
    get radius() {
        return this.size;
    }
    // setters
    set setTheta(theta) {
        this.angles[0] = theta;
    }
    set setPhi(phi) {
        this.angles[1] = phi;
    }
}

class BoundaryBox {
    constructor(width, height, depth) {
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.leftBound = -width / 2;
        this.rightBound = width / 2;
        this.upperBound = height / 2;
        this.lowerBound = -height / 2;
        this.frontBound = depth / 2;
        this.backBound = -depth / 2;
    }

    withinBox(object) {
        let x = object.coords.x;
        let y = object.coords.y;
        let z = object.coords.z;

        let xmove = this.width - 0.2;
        let ymove = this.height - 0.2;
        let zmove = this.depth - 0.2;

        if (x <= this.leftBound) {
            console.log("Too far left!");
            console.log(object.coords);
            object.displace(xmove, 0, 0);
            console.log(object.coords);
        }

        if (x >= this.rightBound) {
            console.log("Too far right!");
            console.log(object.coords);
            object.displace(-xmove, 0, 0);
            console.log(object.coords);
        }

        if (y <= this.lowerBound) {
            console.log("Too low!");
            console.log(object.coords);
            object.displace(0, ymove, 0);
            console.log(object.coords);
        }

        if (y >= this.upperBound) {
            console.log("Too high");
            console.log(object.coords);
            object.displace(0, -ymove, 0);
            console.log(object.coords);
        }

        if (z >= this.frontBound) {
            console.log("Too close!");
            console.log(object.coords);
            object.displace(0,0,-zmove);
            console.log(object.coords);
        }

        if (z <= this.backBound) {
            console.log("Too far away!");
            console.log(object.coords);
            object.displace(0,0,zmove);
            console.log(object.coords);
        }
    }
}

// Corners of the box bounding the player's ship
let playerBoundingBox = [
    vec3(-0.2, 0.2, 0.2),
    vec3(0.2, 0.2, 0.2),
    vec3(-0.2, 0.2, -0.2),
    vec3(0.2, 0.2, -0.2),
    //
    vec3(-0.2, -0.2, 0.2),
    vec3(0.2, -0.2, 0.2),
    vec3(-0.2, -0.2, -0.2),
    vec3(0.2, -0.2, -0.2)
];

function configureTexture(image) {
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return texture;
}

window.onload = function init() {
    console.log(UFO_INTERVAL);
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    colorAsteroid();
    console.log(points.length);

    // boundaryBox = new BoundaryBox(25, 25, 25);
    boundaryBox = new BoundaryBox(7.5,7.5,7.5);
    console.log(boundaryBox);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.8, 0.8, 0.8, 1.0);

    gl.enable(gl.DEPTH_TEST);

    //  Load shaders and initialize attribute buffers
    let program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    /*
    let cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    let vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );
*/
    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    let vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    let tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);

    let vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    let asteroidImage = document.getElementById("texAsteroid");
    asteroidTexture = configureTexture(asteroidImage);

    let bodyImage = document.getElementById("texUFOBody");
    ufoBodyTexture = configureTexture(bodyImage);

    let cockpitImage = document.getElementById("texUFOCockpit");
    ufoCockpitTexture = configureTexture(cockpitImage);

    let laserImage = document.getElementById("texLaser");
    laserTexture = configureTexture( laserImage );

    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);

    proLoc = gl.getUniformLocation(program, "projection");
    mvLoc = gl.getUniformLocation(program, "modelview");

    let proj = perspective(50.0, 1.0, 0.2, 100.0);
    gl.uniformMatrix4fv(proLoc, false, flatten(proj));

    player = new Ship({
        x: 0,
        y: 0,
        z: 0
    }, [
        0.0, 0.0, -1.0
    ], [
        270.0, 90.0
    ], playerBoundingBox, 0.5);

    //Create base sphere for UFO
    ufo = new UFO({
        x: 0,
        y: 0,
        z: -3
    }, 0);

    let asteroid = new Asteroid({
        x: 0,
        y: 0,
        z: -3
    }, 2);
    asteroids.push(asteroid);
    console.log(asteroids);

    let laser = new Laser({x: 0.0, y: 0.0, z: -3.0}, {x: 0.0, y: 0.0, z: -1.0});
    lasers.push(laser);


    // Event listener for keyboard
    window.addEventListener("keydown", function(e) {
        switch (e.keyCode) {
            case 87: // w
                player.addToTheta(degreesPerTurn);
                break;
            case 83: // s
                player.addToTheta(-degreesPerTurn);
                break;
            case 65: // a
                player.addToPhi(-degreesPerTurn);
                break;
            case 68: // d
                player.addToPhi(degreesPerTurn);
                break;
            case 73: // i
                player.addMovement(movementSize);
                spaceshipSound.play();
                break;
            case 75: // k
                player.addMovement(-movementSize);
                break;
            case 32: // space
                explodeAsteroid(asteroids[0]);
                player.shoopDaWhoop();
                break;
            default:
                console.log(e.keyCode);
                break;
        }
    });

    render();
}

// Checks if the two objects are colliding
function detectCollision(obj1, obj2) {
    let collision = false;
    let box1 = obj1.boundingBox;
    let box2 = obj2.boundingBox;
    for (var i = 0; i < obj1.length; i++) {
        // Temporary variable for keeping track if co-ordinates of point from obj1
        // are inside the bounding box of obj2
        let pointInRange = [false, false, false];
        // Check if x co-ordinate of point is inside x co-ordinates of obj2
        if (box1[i][0] >= box2[0][0] && box1[i][0] <= box2[1][0]) {
            pointInRange[0] = true;
            console.log("x in range");
        }
        // Check if y co-ordinate of point is inside y co-ordinates of obj2
        if (box1[i][1] >= box2[0][1] && box1[i][1] <= box2[3][0]) {
            pointInRange[1] = true;
            console.log("y in range");
        }
        // Check if z co-ordinate of point is inside z co-ordinates of obj2
        if (box1[i][2] >= box2[0][2] && box1[i][2] <= box2[2][2]) {
            console.log("z in range");
            pointInRange[0] = true;
        }
        if (pointInRange[0] && pointInRange[1] && pointInRange[2]) {
            collision = true;
            console.log("collision");
        }
    }
    //console.log("no collision");
    return collision;
}

function colorAsteroid() {
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}

function quad(a, b, c, d) {
    let vertices = [
        vec3(-0.5, -0.5, 0.5),
        vec3(-0.5, 0.5, 0.5),
        vec3(0.5, 0.5, 0.5),
        vec3(0.5, -0.5, 0.5),
        vec3(-0.5, -0.5, -0.5),
        vec3(-0.5, 0.5, -0.5),
        vec3(0.5, 0.5, -0.5),
        vec3(0.5, -0.5, -0.5)
    ];

    let texCo = [
        vec2(0, 0),
        vec2(0, 1),
        vec2(1, 1),
        vec2(1, 0)
    ];

    //vertex texture coordinates assigned by the index of the vertex
    let indices = [
        a,
        b,
        c,
        a,
        c,
        d
    ];
    let texind = [
        1,
        0,
        3,
        1,
        3,
        2
    ];

    for (let i = 0; i < indices.length; ++i) {
        points.push(vertices[indices[i]]);
        texCoords.push(texCo[texind[i]]);
    }
}


function drawLaser(laser, ctx){
  gl.bindTexture(gl.TEXTURE_2D, laserTexture);
  ctx = mult(ctx, translate(laser.coords.x, laser.coords.y, laser.coords.z));
  ctx = mult(ctx, scalem(0.1, 0.1, 0.7));
  gl.uniformMatrix4fv(mvLoc, false, flatten(ctx));
  gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function drawLasers(ctx){
  for (var i = 0; i < lasers.length; i++) {
    lasers[i].addMovement(0.01);
    drawLaser(lasers[i], ctx);
  }
}

function explodeAsteroid(asteroid) {
    asteroid.registerHit();
    explosionSound.play();
    if (asteroid.health != 0) {
        for (let i = 0; i < 3; i++) {
            asteroids.push(new Asteroid({
                x: asteroid.coords.x,
                y: asteroid.coords.y,
                z: asteroid.coords.z
            }, asteroid.health));
        }
    }
}

function drawAsteroid(asteroid, ctx) {
    gl.bindTexture(gl.TEXTURE_2D, asteroidTexture);
    ctx = mult(ctx, translate(asteroid.coords.x, asteroid.coords.y, asteroid.coords.z));
    ctx = mult(ctx, scalem(asteroid.size, asteroid.size, asteroid.size));
    gl.uniformMatrix4fv(mvLoc, false, flatten(ctx));
    gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function drawAsteroids(ctx) {
    for (let i = 0; i < asteroids.length; i++) {
        if (asteroids[i].health != 0) {
            drawAsteroid(asteroids[i], ctx);
        }
    }
}

function updateAsteroids() {
    for (let i = 0; i < asteroids.length; i++) {
        let coords = asteroids[i].getCoords;
        let speed = asteroids[i].getSpeed;
        let direction = asteroids[i].getDirection;
        coords.x += speed.dx * direction.xdir;
        coords.y += speed.dy * direction.ydir;
        coords.z += speed.dz * direction.zdir;

        asteroids[i].updateCoords = coords;
    }
}

function drawUFO(ctx) {
    let ctx1 = ctx;
    //draw body
    gl.bindTexture(gl.TEXTURE_2D, ufoBodyTexture);
    ctx1 = mult(ctx, translate(ufo.coords.x, ufo.coords.y, ufo.coords.z));
    ctx1 = mult(ctx1, scalem(0.425, 0.075, 0.425));
    gl.uniformMatrix4fv(mvLoc, false, flatten(ctx1));
    gl.drawArrays(gl.TRIANGLES, 0, 36);

    gl.bindTexture(gl.TEXTURE_2D, ufoCockpitTexture);

    let ctx2 = ctx;
    //draw cockpit
    ctx2 = mult(ctx, translate(ufo.coords.x, ufo.coords.y + 0.10, ufo.coords.z));
    ctx2 = mult(ctx2, scalem(0.15, 0.15, 0.15));
    gl.uniformMatrix4fv(mvLoc, false, flatten(ctx2));
    gl.drawArrays(gl.TRIANGLES, 0, 36);

}

function updateUFO() {
    let coords = ufo.getCoords;
    let speed = ufo.getSpeed;
    let direction = ufo.getDirection;
    coords.x += speed.dx * direction.xdir;
    coords.y += speed.dy * direction.ydir;
    coords.z += speed.dz * direction.zdir;

    ufo.updateCoords = coords;
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Positon viewer
    let mv = lookAt(player.positionVector, player.eyeVector, vec3(0.0, 1.0, 0.0));

    boundaryBox.withinBox(player);
    boundaryBox.withinBox(asteroids[0]);

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));

    gl.drawArrays(gl.TRIANGLES, 36, points.length-36);

    drawLasers(mv);

    drawAsteroids(mv);
    updateAsteroids();

    if (ufo.health != 0) {
        drawUFO(mv);
        updateUFO();
    }

    requestAnimFrame(render);
}
