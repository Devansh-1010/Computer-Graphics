var gl;
var color;
var matrixStack = [];
// mMatrix is called the model matrix, transforms objects
// from local object space to world space.
var mMatrix = mat4.create();
var uMMatrixLocation;
var aPositionLocation;
var uColorLoc;
var mode = 'solid';  // mode for drawing
const vertexShaderCode = `#version 300 es
in vec2 aPosition;
uniform mat4 uMMatrix;

void main() {
    gl_Position = uMMatrix*vec4(aPosition,0.0,1.0);
    gl_PointSize = 5.0;
}`;
const fragShaderCode = `#version 300 es
precision mediump float;
out vec4 fragColor;
uniform vec4 color;

void main() {
    fragColor = color;
}`;
function pushMatrix(stack, m) {
    //necessary because javascript only does shallow push
    var copy = mat4.create(m);
    stack.push(copy);
}
function popMatrix(stack) {
    if (stack.length > 0) return stack.pop();
    else console.log("stack has no matrix to pop!");
}
function vertexShaderSetup(vertexShaderCode) {
    shader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(shader, vertexShaderCode);
    gl.compileShader(shader);
    // Error check whether the shader is compiled correctly
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}
function fragmentShaderSetup(fragShaderCode) {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(shader, fragShaderCode);
    gl.compileShader(shader);
    // Error check whether the shader is compiled correctly
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}
function initShaders() {
    shaderProgram = gl.createProgram();
    var vertexShader = vertexShaderSetup(vertexShaderCode);
    var fragmentShader = fragmentShaderSetup(fragShaderCode);

    // attach the shaders
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    //link the shader program
    gl.linkProgram(shaderProgram);

    // check for compilation and linking status
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.log(gl.getShaderInfoLog(vertexShader));
        console.log(gl.getShaderInfoLog(fragmentShader));
    }

    //finally use the program.
    gl.useProgram(shaderProgram);

    return shaderProgram;
}
function initGL(canvas) {
    try {
        gl = canvas.getContext("webgl2"); // the graphics webgl2 context
        gl.viewportWidth = canvas.width; // the width of the canvas
        gl.viewportHeight = canvas.height; // the height
    } catch (e) {}
    if (!gl) {
        alert("WebGL initialization failed");
    }
}
function initSquareBuffer() {
    // buffer for point locations
    const sqVertices = new Float32Array([
        0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
    ]);
    sqVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sqVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, sqVertices, gl.STATIC_DRAW);
    sqVertexPositionBuffer.itemSize = 2;
    sqVertexPositionBuffer.numItems = 4;

    // buffer for point indices
    const sqIndices = new Uint16Array([0, 1, 2, 0, 2, 3]);
    sqVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sqVertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sqIndices, gl.STATIC_DRAW);
    sqVertexIndexBuffer.itemsize = 1;
    sqVertexIndexBuffer.numItems = 6;
}
function drawSquare(color, mMatrix) {
    gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);

    // buffer for point locations
    gl.bindBuffer(gl.ARRAY_BUFFER, sqVertexPositionBuffer);
    gl.vertexAttribPointer(aPositionLocation, sqVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    // buffer for point indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sqVertexIndexBuffer);
    gl.uniform4fv(uColorLoc, color);

    // now draw the square
    // show the solid view
    if (mode === 'solid') {
        gl.drawElements(gl.TRIANGLES, sqVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }
    // show the wireframe view
    else if (mode === 'wideframe') {
        gl.drawElements(gl.LINE_LOOP, sqVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }
    // show the point view
    else if (mode === 'point') {
        gl.drawElements(gl.POINTS, sqVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }    
}
function initTriangleBuffer() {
    // buffer for point locations
    const triangleVertices = new Float32Array([0.0, 0.5, -0.5, -0.5, 0.5, -0.5]);
    triangleBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuf);
    gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);
    triangleBuf.itemSize = 2;
    triangleBuf.numItems = 3;

    // buffer for point indices
    const triangleIndices = new Uint16Array([0, 1, 2]);
    triangleIndexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleIndexBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangleIndices, gl.STATIC_DRAW);
    triangleIndexBuf.itemsize = 1;
    triangleIndexBuf.numItems = 3;
}
function drawTriangle(color, mMatrix) {
    gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);

    // buffer for point locations
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuf);
    gl.vertexAttribPointer(aPositionLocation, triangleBuf.itemSize, gl.FLOAT, false, 0, 0);

    // buffer for point indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleIndexBuf);
    gl.uniform4fv(uColorLoc, color);

    // now draw the triangle
    if (mode === 'solid') {
        gl.drawElements(gl.TRIANGLES, triangleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
    else if (mode === 'wideframe') {
        gl.drawElements(gl.LINE_LOOP, triangleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
    else if (mode === 'point') {
        gl.drawElements(gl.POINTS, triangleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
}
function initCircleBuffer()
{
    // for drawing the circle
    const numSegments = 100; 
    const angleIncrement = (Math.PI * 2) / numSegments;
    const positions = [0, 0]; // Center at (0, 0)
    for (let i = 0; i <= numSegments; i++) {
        const angle = angleIncrement * i;
        const x = Math.cos(angle);
        const y = Math.sin(angle);
        positions.push(x, y);
    }
    const circleVertices = new Float32Array(positions);
    // bind for point locations
    circleBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, circleBuf);
    gl.bufferData(gl.ARRAY_BUFFER, circleVertices, gl.STATIC_DRAW);
    circleBuf.itemSize = 2;
    circleBuf.numItems = numSegments + 1;
    // Initialize indices for drawing triangles
    const indices = [];
    for (let i = 1; i <= numSegments; i++) {
        indices.push(0, i, i + 1);                 //0 is centre then creating triangle with 0,1,2 ; 0,2,3; .... 
    }
    indices.push(0, numSegments, 1); // Close the circle

    // Convert indices array to Uint16Array
    const circleIndices = new Uint16Array(indices);

    // bind for point indices
    circleIndexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, circleIndexBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, circleIndices, gl.STATIC_DRAW);
    circleIndexBuf.itemSize = 1;
    circleIndexBuf.numItems = indices.length;
}
function drawCircle(color, mMatrix) {
    gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
    // buffer for point locations
    gl.bindBuffer(gl.ARRAY_BUFFER, circleBuf);
    gl.vertexAttribPointer(aPositionLocation, circleBuf.itemSize, gl.FLOAT, false, 0, 0);
    // buffer for point indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, circleIndexBuf);
    gl.uniform4fv(uColorLoc, color);
    //circle based on the specified mode
    if (mode === 'solid') {
        gl.drawElements(gl.TRIANGLES, circleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    } else if (mode === 'wideframe') {
        gl.drawElements(gl.LINE_LOOP, circleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    } else if (mode === 'point') {
        gl.drawElements(gl.POINTS, circleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
}
function drawSky() {
    // initialize the model matrix to identity matrix
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    color = [0,0,0, 1];  
    mMatrix = mat4.translate(mMatrix, [0.5, 0.5, 0]);
    mMatrix = mat4.scale(mMatrix, [4.0, 2.0, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}
function drawGround() {
    // initialize the model matrix to identity matrix
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    color = [0.147, 0.6, 0.190, 0.8];
    mMatrix = mat4.translate(mMatrix, [0.0, -0.6, 0]);
    mMatrix = mat4.scale(mMatrix, [2.0, 1.27, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}
function drawCloud() {
    // initialize the model matrix to identity matrix
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    //creating first cloud
    color = [0.0, 0.0, 0.0, 0.35];
    mMatrix = mat4.translate(mMatrix, [-0.82, 0.52, 0]);
    mMatrix = mat4.scale(mMatrix, [0.24, 0.13, 1.0]);
    drawCircle(color, mMatrix);
    //creating second cloud
    mMatrix = popMatrix(matrixStack);
    color = [0.0, 0.0, 0.0, 0.0];
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.6, 0.49, 0]);
    mMatrix = mat4.scale(mMatrix, [0.17, 0.1, 1.0]);
    drawCircle(color, mMatrix);
    //creating third cloud
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    color = [0.0, 0.0, 0.0, 0.3];
    mMatrix = mat4.translate(mMatrix, [-0.42, 0.5, 0]);
    mMatrix = mat4.scale(mMatrix, [0.08, 0.05, 1.0]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}
function drawRiver() {
    // Initialize the model matrix to identity matrix
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    // Draw the river
    let color = [0, 0, 0.9, 0.7];
    mMatrix = mat4.translate(mMatrix, [0.0, -0.15, 0]);
    mMatrix = mat4.scale(mMatrix, [3.0, 0.28, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    // First line
    mMatrix = mat4.translate(mMatrix, [-0.72, -0.16, 0]);
    mMatrix = mat4.rotate(mMatrix, 4.71, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [0.003, 0.37, 1.0]);
    color = [0.9, 0.9, 0.9, 0.8];
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    // third line 
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.65, -0.24, 0]);
    mMatrix = mat4.rotate(mMatrix, 4.71, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [0.003, 0.4, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    // second line 
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0, -0.11, 0]);
    mMatrix = mat4.rotate(mMatrix, 4.71, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [0.003, 0.4, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}
function drawMoon(rotationAngle) {
    // Initialize the model matrix to identity matrix
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    color1 = [1, 1, 1, 1];
    mMatrix = mat4.translate(mMatrix, [-0.72, 0.82, 0]);
    mMatrix = mat4.scale(mMatrix, [0.12, 0.12, 1.0]);
    drawCircle(color1, mMatrix);
    mMatrix = popMatrix(matrixStack);
    //creating rays of moon with rotation angle
    color2 = [1, 1, 1, 1]; 
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2) * i / 8;
        pushMatrix(matrixStack, mMatrix);
        mMatrix = mat4.translate(mMatrix, [-0.72, 0.82, 0]); 
        mMatrix = mat4.rotate(mMatrix, rotationAngle+angle, [0, 0, 1]); 
        mMatrix = mat4.scale(mMatrix, [0.3, 0.003, 1.0]); 
        drawSquare(color2, mMatrix);
        mMatrix = popMatrix(matrixStack);
    }
}
let twinkle_speed = 0;
function drawStar(sq_t_x, sq_t_y, sq_s_x, sq_s_y, tr_s_x, tr_s_y) {
    mat4.identity(mMatrix);
    // Update speed
    twinkle_speed += 0.01; 
    let twinkleScale = 1.8 + 0.3 * Math.sin(twinkle_speed); 
    pushMatrix(matrixStack, mMatrix);
    color = [1.0, 1.0, 1.0, 1.0];
    // Draw the top triangle
    mMatrix = mat4.translate(mMatrix, [sq_t_x, sq_t_y + sq_s_y / 2 + tr_s_y / 2, 0]);
    mMatrix = mat4.rotate(mMatrix, 0, [0, 0, 1]);  
    mMatrix = mat4.scale(mMatrix, [tr_s_x * twinkleScale, tr_s_y * twinkleScale, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // Draw the bottom triangle
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [sq_t_x, sq_t_y - sq_s_y / 2 - tr_s_y / 2, 0]);
    mMatrix = mat4.rotate(mMatrix, Math.PI, [0, 0, 1]);  
    mMatrix = mat4.scale(mMatrix, [tr_s_x * twinkleScale, tr_s_y * twinkleScale, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // Draw the left triangle
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [sq_t_x - sq_s_x / 2 - tr_s_y / 2, sq_t_y, 0]);
    mMatrix = mat4.rotate(mMatrix, Math.PI / 2, [0, 0, 1]);  
    mMatrix = mat4.scale(mMatrix, [tr_s_x * twinkleScale, tr_s_y * twinkleScale, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // Draw the right triangle
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [sq_t_x + sq_s_x / 2 + tr_s_y / 2, sq_t_y, 0]);
    mMatrix = mat4.rotate(mMatrix, -Math.PI / 2, [0, 0, 1]); 
    mMatrix = mat4.scale(mMatrix, [tr_s_x * twinkleScale, tr_s_y * twinkleScale, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);

    // Draw the central square
    mMatrix = mat4.translate(mMatrix, [sq_t_x, sq_t_y, 0]);
    mMatrix = mat4.scale(mMatrix, [sq_s_x, sq_s_y, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    
}

function drawRoad() {
    // initialize the model matrix to identity matrix
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    color = [0.30, 0.5, 0, 0.85];
    mMatrix = mat4.translate(mMatrix, [0.6, -0.8, 0]);
    mMatrix = mat4.rotate(mMatrix, 7.2, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [1.6, 2, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}
function drawMountain(t_x1, t_y1, s_x, s_y, t_x2 = null, t_y2 = null, s_x2 = null, s_y2 = null, angle = 0) {
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    color = [0.51, 0.361, 0.259, 1];;
    if (t_x2 === null && t_y2 === null) {
        color = [0.588, 0.471, 0.322, 1]; // Adjust color if only one mountain
    }
    mMatrix = mat4.translate(mMatrix, [t_x1, t_y1, 0]);
    mMatrix = mat4.scale(mMatrix, [s_x, s_y, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // Draw the second mountain (shadow) if parameters are provided
    if (t_x2 !== null && t_y2 !== null && s_x2 !== null && s_y2 !== null) {
        mat4.identity(mMatrix);
        pushMatrix(matrixStack, mMatrix);
        color = [0.588, 0.471, 0.322, 1];
        mMatrix = mat4.translate(mMatrix, [t_x2, t_y2, 0]);
        if (angle !== 0) {
            mMatrix = mat4.rotate(mMatrix, angle, [0, 0, 1]);
        }
        mMatrix = mat4.scale(mMatrix, [s_x2, s_y2, 1.0]);
        drawTriangle(color, mMatrix);
        mMatrix = popMatrix(matrixStack);
    }
}
function drawTree(t_x, t_y, s_x, s_y) {
    mat4.identity(mMatrix);
    mMatrix = mat4.translate(mMatrix, [t_x, t_y, 0]);
    mMatrix = mat4.scale(mMatrix, [s_x, s_y, 1.0]);

    // Stem of the tree
    pushMatrix(matrixStack, mMatrix);
    color = [0.4, 0.2, 0.1, 0.9];
    mMatrix = mat4.translate(mMatrix, [0.55, 0.21, 0]);
    mMatrix = mat4.scale(mMatrix, [0.05, 0.37, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    
    //branches and leaves of tree
    pushMatrix(matrixStack, mMatrix);
    color = [0.133, 0.545, 0.133, 1];
    mMatrix = mat4.translate(mMatrix, [0.55, 0.45, 0]);
    mMatrix = mat4.scale(mMatrix, [0.35, 0.3, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    color = [0.133, 0.545, 0.133, 0.9];
    mMatrix = mat4.translate(mMatrix, [0.55, 0.5, 0]);
    mMatrix = mat4.scale(mMatrix, [0.375, 0.3, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    color = [0.133, 0.545, 0.133, 0.8];
    mMatrix = mat4.translate(mMatrix, [0.55, 0.55, 0]);
    mMatrix = mat4.scale(mMatrix, [0.4, 0.3, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}
function drawBoats(speed1, speed2) {
    // Draw Boat 2
    mat4.identity(mMatrix);
    // Apply global translation for Boat 2
    mMatrix = mat4.translate(mMatrix, [speed2, 0, 0]);

    // Create the flag pole for Boat 2
    pushMatrix(matrixStack, mMatrix);
    let color = [0, 0, 0, 1.0];
    mMatrix = mat4.translate(mMatrix, [0.005, 0.003, 0]);
    mMatrix = mat4.scale(mMatrix, [0.005, 0.125, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // Create the flag pole rope for Boat 2
    pushMatrix(matrixStack, mMatrix);
    color = [0, 0, 0, 1.0];
    mMatrix = mat4.translate(mMatrix, [-0.015, -0.005, 0]);
    mMatrix = mat4.rotate(mMatrix, 5.9, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [0.0025, 0.115, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // Create the flag for Boat 2
    pushMatrix(matrixStack, mMatrix);
    color = [0.5, 0, 0.5, 1];
    mMatrix = mat4.translate(mMatrix, [0.0545, 0.003, 0]);
    mMatrix = mat4.rotate(mMatrix, 4.72, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [0.09, 0.09, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // Create base of Boat 2
    pushMatrix(matrixStack, mMatrix);
    color = [0.7, 0.7, 0.7, 1];
    mMatrix = mat4.translate(mMatrix, [0, -0.075, 0]);
    mMatrix = mat4.scale(mMatrix, [0.09, 0.03, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.045, -0.075, 0]);
    mMatrix = mat4.rotate(mMatrix, -3.15, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [0.05, 0.03, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.045, -0.075, 0]);
    mMatrix = mat4.rotate(mMatrix, -3.15, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [0.05, 0.03, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // Draw Boat 1
    mat4.identity(mMatrix);
    // Apply global translation for Boat 1
    mMatrix = mat4.translate(mMatrix, [speed1, 0, 0]);

    // Create the flag pole for Boat 1
    pushMatrix(matrixStack, mMatrix);
    color = [0, 0, 0, 1.0];
    mMatrix = mat4.translate(mMatrix, [0.01, 0.006, 0]);
    mMatrix = mat4.scale(mMatrix, [0.01, 0.27, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // Create the flag pole rope for Boat 1
    pushMatrix(matrixStack, mMatrix);
    color = [0, 0, 0, 1.0];
    mMatrix = mat4.translate(mMatrix, [-0.03, -0.01, 0]);
    mMatrix = mat4.rotate(mMatrix, 5.9, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [0.005, 0.25, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // Create the flag for Boat 1
    pushMatrix(matrixStack, mMatrix);
    color = [1, 0, 0, 0.9];
    mMatrix = mat4.translate(mMatrix, [0.11, 0.006, 0]);
    mMatrix = mat4.rotate(mMatrix, 4.72, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [0.19, 0.19, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // Create base of Boat 1
    pushMatrix(matrixStack, mMatrix);
    color = [0.7, 0.7, 0.7, 1];
    mMatrix = mat4.translate(mMatrix, [0, -0.15, 0]);
    mMatrix = mat4.scale(mMatrix, [0.18, 0.05, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.09, -0.15, 0]);
    mMatrix = mat4.rotate(mMatrix, -3.15, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [0.1, 0.05, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.09, -0.15, 0]);
    mMatrix = mat4.rotate(mMatrix, -3.15, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [0.1, 0.05, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}

function drawHouse() {
    // initialize the model matrix to identity matrix
    mat4.identity(mMatrix);

    // roof of the house
    pushMatrix(matrixStack, mMatrix);
    color = [0.9, 0.1, 0.1, 1];
    mMatrix = mat4.translate(mMatrix, [-0.5, -0.3, 0]);
    mMatrix = mat4.scale(mMatrix, [0.4, 0.2, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.7, -0.3, 0]);
    mMatrix = mat4.rotate(mMatrix, 6.285, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [0.25, 0.2, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.3, -0.3, 0]);
    mMatrix = mat4.rotate(mMatrix, 6.285, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [0.25, 0.2, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // base of the house
    pushMatrix(matrixStack, mMatrix);
    color = [0.8, 0.8, 0.8, 1];
    mMatrix = mat4.translate(mMatrix, [-0.5, -0.525, 0]);
    mMatrix = mat4.scale(mMatrix, [0.5, 0.25, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // windows
    pushMatrix(matrixStack, mMatrix);
    color = [0.85, 0.7, 0, 1];
    mMatrix = mat4.translate(mMatrix, [-0.65, -0.47, 0]);
    mMatrix = mat4.scale(mMatrix, [0.08, 0.08, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.35, -0.47, 0]);
    mMatrix = mat4.scale(mMatrix, [0.08, 0.08, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // door of the house
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.5, -0.56, 0]);
    mMatrix = mat4.scale(mMatrix, [0.08, 0.18, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}
function drawBush(move=false, t_x=0, t_y=0, s=0) {
    // initialize the model matrix to identity matrix
    mat4.identity(mMatrix);
    if (move) {
        mMatrix = mat4.translate(mMatrix, [t_x, t_y, 0]);
        mMatrix = mat4.scale(mMatrix, [s, s, 0]);
    }
    pushMatrix(matrixStack, mMatrix);
    color = [0, 0.7, 0, 0.9];
    mMatrix = mat4.translate(mMatrix, [-1, -0.55, 0]);
    mMatrix = mat4.scale(mMatrix, [0.065, 0.055, 1.0]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    color = [0, 0.4, 0, 0.9];
    mMatrix = mat4.translate(mMatrix, [-0.72, -0.55, 0]);
    mMatrix = mat4.scale(mMatrix, [0.06, 0.05, 1.0]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    color = [0, 0.51, 0, 0.9]
    mMatrix = mat4.translate(mMatrix, [-0.86, -0.53, 0]);
    mMatrix = mat4.scale(mMatrix, [0.12, 0.09, 1.0]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}
function drawCar() {
    // initialize the model matrix to identity matrix
    mat4.identity(mMatrix);
    // Draw the main body of the car
    pushMatrix(matrixStack, mMatrix);
    color = [0, 0, 0.6, 0.9];
    mMatrix = mat4.translate(mMatrix, [-0.445, -0.74, 0]);
    mMatrix = mat4.scale(mMatrix, [0.15, 0.11, 1.0]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    
    pushMatrix(matrixStack, mMatrix);
    color = [0.5, 0.5, 0.5, 0.76];
    mMatrix = mat4.translate(mMatrix, [-0.44, -0.72, 0]);
    mMatrix = mat4.scale(mMatrix, [0.2, 0.07, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);

    //left wheel
    color = [0, 0, 0, 1];
    mMatrix = mat4.translate(mMatrix, [-0.57, -0.87, 0]);
    mMatrix = mat4.scale(mMatrix, [0.04, 0.04, 1.0]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    color = [0.51, 0.51, 0.51, 1];
    mMatrix = mat4.translate(mMatrix, [-0.57, -0.87, 0]);
    mMatrix = mat4.scale(mMatrix, [0.03, 0.03, 1.0]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // Right wheel
    pushMatrix(matrixStack, mMatrix);
    color = [0, 0, 0, 1];
    mMatrix = mat4.translate(mMatrix, [-0.29, -0.87, 0]); // Adjust translation for the right wheel
    mMatrix = mat4.scale(mMatrix, [0.04, 0.04, 1.0]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    color = [0.51, 0.51, 0.51, 1];
    mMatrix = mat4.translate(mMatrix, [-0.29, -0.87, 0]); // Adjust translation for the right wheel
    mMatrix = mat4.scale(mMatrix, [0.03, 0.03, 1.0]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // Draw the car windows
    pushMatrix(matrixStack, mMatrix);
    color = [0, 0, 0.6, 0.7];
    mMatrix = mat4.translate(mMatrix, [-0.44, -0.8, 0]);
    mMatrix = mat4.scale(mMatrix, [0.39, 0.1, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // Draw the top left window triangle
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.245, -0.8, 0]);
    mMatrix = mat4.rotate(mMatrix, 6.285, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [0.14, 0.1, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // Draw the top right window triangle
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.635, -0.8, 0]);
    mMatrix = mat4.rotate(mMatrix, 6.285, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [0.14, 0.1, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}
function drawWindMill1(rotationAngle) {
    //Windmill 1
    // Draw the pole
    pushMatrix(matrixStack, mMatrix);
    let color = [0.2, 0.15, 0.1, 1];
    mMatrix = mat4.translate(mMatrix, [0.5, -0.18, 0]);
    mMatrix = mat4.scale(mMatrix, [0.015, 0.3, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // Draw the fan blades 
    for (let i = 0; i < 4; i++) {
        pushMatrix(matrixStack, mMatrix);
        color = [0.7,0.7588,0.3451, 0.999999];
        const angle = rotationAngle + (i * Math.PI / 2);
        mMatrix = mat4.translate(mMatrix, [0.5, -0.03, 0]);
        mMatrix = mat4.rotate(mMatrix,- angle, [0, 0, 1]);
        mMatrix = mat4.scale(mMatrix, [0.05, 0.2, 1.0]);
        mMatrix = mat4.translate(mMatrix, [0.005, -0.3, 0]);
        drawTriangle(color, mMatrix);
        mMatrix = popMatrix(matrixStack);
    }

    // Draw the center circle
    color = [0, 0, 0, 1];
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.5, -0.03, 0]);
    mMatrix = mat4.scale(mMatrix, [0.015, 0.015, 1.0]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    // Winmill 2
}
function drawWindMill2(rotationAngle)
{
        // Draw first the square (pole) 
        pushMatrix(matrixStack, mMatrix);
         color = [0.2, 0.15, 0.1, 1];
        mMatrix = mat4.translate(mMatrix, [0.7, -0.25, 0]);
        mMatrix = mat4.scale(mMatrix, [0.03, 0.55, 1.0]);
        drawSquare(color, mMatrix);
        mMatrix = popMatrix(matrixStack);
    
        // Draw the fan blades using a loop
        for (let i = 0; i < 4; i++) {
            pushMatrix(matrixStack, mMatrix);
            color = [0.7, 0.7588, 0.3451, 0.999999];
            const angle = rotationAngle + (i * Math.PI / 2);
            mMatrix = mat4.translate(mMatrix, [0.7, 0.03, 0]); 
            mMatrix = mat4.rotate(mMatrix,-angle, [0, 0, 1]);  
            mMatrix = mat4.scale(mMatrix, [0.07, 0.28, 1.0]);   
            mMatrix = mat4.translate(mMatrix, [0.015, -0.33, 0]);
            drawTriangle(color, mMatrix);
            mMatrix = popMatrix(matrixStack);
        }
        // Draw the center circle
        color = [0, 0, 0, 1];
        pushMatrix(matrixStack, mMatrix);
        mMatrix = mat4.translate(mMatrix, [0.7, 0.03, 0]); 
        mMatrix = mat4.scale(mMatrix, [0.018, 0.018, 1.0]);
        drawCircle(color, mMatrix);
        mMatrix = popMatrix(matrixStack);
}
////////////////////////////////////////////////////////////////////////
function drawScene() {
    let animation;
    let speed1 = 0.0;
    let speed2 = 0.0;
    const translationSpeed = 0.001;
    const translationRange1 = 0.7;
    const translationRange2 = 0.8;
    let direction1 = 1;
    let direction2 = 1;
    let rotationAngle = 0.0;
    const rotationSpeed = 0.03;
    if (animation) {
        window.cancelAnimationFrame(animation);
    }

    function animate() {
        // Update the rotation angle
        rotationAngle += rotationSpeed;
        // Update translation based on direction
        speed1 += translationSpeed * direction1;
        speed2 += translationSpeed * direction2;
        // Reverse direction at translationRange
        if (Math.abs(speed1) > translationRange1) {
            direction1 *= -1;
        }
        if (Math.abs(speed2) > translationRange2) {
            direction2 *= -1;
        }
        drawSky();
        drawCloud();
        drawMoon(rotationAngle);
        drawMountain(-0.61, 0.15, 1.08, 0.23, -0.59, 0.165, 1.1, 0.2,6.47);
        drawMountain(-0.06, 0.09, 1.99, 0.58, -0.02, 0.096, 1.79, 0.57,6.43);
        drawMountain(0.79, 0.11, 1.0, 0.17, null, null, null, null);
        drawGround();
        drawRoad();
        drawRiver();
        drawTree(0.35, 0, 0.85, 0.85);
        drawTree(0, 0, 1.0, 1.0);
        drawTree(-0.14, 0, 0.8, 0.8);
        drawBoats(speed1,speed2); 
        drawStar(-0.3, 0.7, 0.015, 0.015,  0.007, 0.016);
        drawStar(-0.16, 0.6, 0.012, 0.012, 0.007, 0.016);
        drawStar(-0.21, 0.5, 0.008, 0.012, 0.003, 0.008);
        drawStar(0.35, 0.75, 0.012, 0.012, 0.01, 0.028);
        drawStar(0.55, 0.95, 0.012, 0.012, 0.005, 0.012);
        drawBush(true,0.03,0,1);
        drawBush(true, 0.75, 0, 1.02);
        drawBush(true, 1.48, -0.13, 1.6);
        drawBush(true, 2.15, 0.25, 1.3);
        drawHouse();
        drawCar();
        drawWindMill1(rotationAngle);
        drawWindMill2(rotationAngle);
        animation = window.requestAnimationFrame(animate);
    }
    animate();
}
function webGLStart() {
    var canvas = document.getElementById("Assignment-1");
    initGL(canvas);
    shaderProgram = initShaders();
    const aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");

    uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");
    gl.enableVertexAttribArray(aPositionLocation);
    uColorLoc = gl.getUniformLocation(shaderProgram, "color");

    initSquareBuffer();
    initTriangleBuffer();
    initCircleBuffer();
    drawScene();
}
function changemode(m) {
    mode = m;
    drawScene();
}
