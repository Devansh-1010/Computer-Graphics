var gl;
var canvas;

var matrixStack = [];

var cubeBuf;
var cubeIndexBuf;
var cubeNormalBuf;
var sphereBuf;
var sphereIndexBuf;
var sphereNormalBuf;

var spVerts = [];
var spIndicies = [];
var spNormals = [];

var aPositionLocation;
var aNormalLocation;
var uPMatrixLocation;
var uMMatrixLocation;
var uVMatrixLocation;
var normalMatrixLocation;

var degree0 = 0.0;
var degree1 = 0.0;
var degree2 = 0.0;
var degree3 = 0.0;
var degree4 = 0.0;
var degree5 = 0.0;
var prevMouseX = 0.0;
var prevMouseY = 0.0;

// initialize model, view, and projection matrices
var vMatrix = mat4.create(); // view matrix
var mMatrix = mat4.create(); // model matrix
var pMatrix = mat4.create(); //projection matrix
var uNormalMatrix = mat3.create(); // normal matrix

// specify camera/eye coordinate system parameters
var eyePos = [0.0, 0.0, 2.0];
var COI = [0.0, 0.0, 0.0];
var viewUp = [0.0, 1.0, 0.0];

var lightPosition = [0, 2, 3]; //initial position of light source
var ambientColor = [1, 1, 1];     //default ambient
var diffuseColor = [1,1,1];  //default diffuse
var specularColor = [1,1,1];   //default specular


/////////////////////////////////////////////////////////////////////////
// flat Shading
// Vertex shader code
const flatVertexShaderCode = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;
uniform mat4 uMMatrix;
uniform mat4 uPMatrix;
uniform mat4 uVMatrix;

out mat4 viewMatrix;
out vec3 vPosEyeSpace;

void main() {
    mat4 projectionModelView;
    projectionModelView = uPMatrix * uVMatrix * uMMatrix;
    gl_Position = projectionModelView * vec4(aPosition, 1.0);
    viewMatrix = uVMatrix;
    vPosEyeSpace = (uVMatrix * uMMatrix * vec4(aPosition, 1.0)).xyz;
    gl_PointSize = 5.0;
}`;
// Fragment shader code
const flatFragShaderCode = `#version 300 es
precision mediump float;
in vec3 vPosEyeSpace;
uniform vec3 uLightPosition;
uniform vec3 uAmbientColor;
uniform vec3 uDiffuseColor;
uniform vec3 uSpecularColor;
in mat4 viewMatrix;

out vec4 fragColor;

void main() {
    // Compute face normal and normalize it
 
     vec3 normal = normalize(cross(dFdx(vPosEyeSpace), dFdy(vPosEyeSpace)));

    // Convert light position to eye space
    vec3 lightPositionEyeSpace = (viewMatrix * vec4(uLightPosition, 1.0)).xyz;

    // Compute light vector (L) (from vertex position to light position) and normalize

    vec3 L = normalize(lightPositionEyeSpace - vPosEyeSpace);

    // Compute view vector (from vertex to camera) and normalize
    vec3 V = normalize(-vPosEyeSpace);

    // Compute reflection vector (R) and normalize

    vec3 R = normalize(reflect(-L, normal));

    float ambient = 0.15;
    float diffuse = max(dot(normal, L), 0.0);
    float specular = pow(max(dot(R, V), 0.0), 32.0);

    // compute the Phong shading lighting
    vec3 lightingColor = uAmbientColor * ambient + uDiffuseColor * diffuse + uSpecularColor * specular;

    // Output the final color
    fragColor = vec4(lightingColor, 1.0);
}`;

function drawLeftViewport() {
    gl.enable(gl.SCISSOR_TEST);
    gl.viewport(0, 0, 400, 400);
    gl.scissor(0, 0, 400, 400);

    gl.clearColor(0.83, 0.8, 0.9, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    shaderProgram = flatShaderProgram;
    gl.useProgram(shaderProgram);

    // Get locations of attributes and uniforms declared in the shader
    aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");
    aNormalLocation = gl.getAttribLocation(shaderProgram, "aNormal");
    uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");
    uVMatrixLocation = gl.getUniformLocation(shaderProgram, "uVMatrix");
    uPMatrixLocation = gl.getUniformLocation(shaderProgram, "uPMatrix");
    uLightPositionLocation = gl.getUniformLocation(shaderProgram, 'uLightPosition');
    uAmbientColorLocation = gl.getUniformLocation(shaderProgram, 'uAmbientColor');
    uDiffuseColorLocation = gl.getUniformLocation(shaderProgram, 'uDiffuseColor');
    uSpecularColorLocation = gl.getUniformLocation(shaderProgram, 'uSpecularColor');

    // Enable the attribute arrays
    gl.enableVertexAttribArray(aPositionLocation);
    gl.enableVertexAttribArray(aNormalLocation);

    // Initialize buffers for the sphere and cube
    initSphereBuffer();
    initCubeBuffer();

    gl.enable(gl.DEPTH_TEST);

    // Set up matrices
    mat4.identity(vMatrix);
    mat4.lookAt(eyePos, COI, viewUp, vMatrix);
    mat4.identity(pMatrix);
    mat4.perspective(50, 1.0, 0.1, 1000, pMatrix);

    mat4.identity(mMatrix);

    // transformations applied here on model matrix
    mMatrix = mat4.rotate(mMatrix, degToRad(degree0), [0, 1, 0]);
    mMatrix = mat4.rotate(mMatrix, degToRad(degree1), [1, 0, 0]);
    
    mMatrix = mat4.rotate(mMatrix, 0.48, [0, 1, 0]);
    mMatrix = mat4.rotate(mMatrix, 0.18, [1, 0, 0]);
    mMatrix = mat4.rotate(mMatrix, 0.1, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [1, 1, 1]);
    mMatrix = mat4.translate(mMatrix, [0, -0.1, 0]);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0, 0.52, 0]);
    mMatrix = mat4.scale(mMatrix, [0.315, 0.315, 0.315]);
    diffuseColor = [0.1, 0.4, 0.65];
    drawSphere();
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);


    mMatrix = mat4.translate(mMatrix, [0, -0.19, 0]);
    mMatrix = mat4.scale(mMatrix, [0.47, 0.83, 0.5]);
    diffuseColor = [0.7, 0.7, 0.5];
    drawCube();
    mMatrix = popMatrix(matrixStack);
}
///////////////////////////////////////////////////////////////////////
// Gouraud Shading

// Vertex shader code
const perVertVertexShaderCode = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;
uniform mat4 uMMatrix;
uniform mat4 uPMatrix;
uniform mat4 uVMatrix;
uniform mat3 uNMatrix;
uniform mat3 uModelMatrix;
out vec3 finalcolor;

uniform vec3 uLightPosition;  
uniform vec3 uAmbientColor;
uniform vec3 uDiffuseColor;
uniform vec3 uSpecularColor;

void main() {
    vec3 posEyeSpace = (uVMatrix * uMMatrix * vec4(aPosition, 1.0)).xyz;
    vec3 lightEyeSpace = (uVMatrix * vec4(uLightPosition, 1.0)).xyz;
    mat3 uModelMatrix = mat3(uVMatrix * uMMatrix);
    mat3 uNMatrix = transpose(inverse(uModelMatrix));
    vec3 normalEyeSpace = normalize(uNMatrix* aNormal);
    
    vec3 L = normalize(lightEyeSpace - posEyeSpace);
    vec3 V = normalize(-posEyeSpace);
    vec3 R = reflect(-L, normalEyeSpace);
    float ambient = 0.15;
    
    float diffuse = max(dot(normalEyeSpace, L), 0.0);
    float specular = pow(max(dot(R, V), 0.0), 32.0);
    finalcolor = uAmbientColor * ambient + uDiffuseColor * diffuse + uSpecularColor * specular;
    gl_Position = uPMatrix * uVMatrix * uMMatrix * vec4(aPosition, 1.0);
}`;

// Fragment shader code
const perVertFragShaderCode = `#version 300 es
    precision mediump float;
    in vec3 finalcolor;
    out vec4 fragColor;
    void main() {
        fragColor = vec4(finalcolor, 1.0);
        
}`;
function drawMidViewport() {
    gl.viewport(400, 0, 400, 400);
    gl.scissor(400, 0, 400, 400);
    gl.clearColor(0.95, 0.85, 0.85, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    shaderProgram = perVertShaderProgram;
    gl.useProgram(shaderProgram);

    // Get locations of attributes and uniforms declared in the shader
    aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");
    aNormalLocation = gl.getAttribLocation(shaderProgram, "aNormal");
    uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");
    uVMatrixLocation = gl.getUniformLocation(shaderProgram, "uVMatrix");
    uPMatrixLocation = gl.getUniformLocation(shaderProgram, "uPMatrix");
    uLightPositionLocation = gl.getUniformLocation(shaderProgram, 'uLightPosition');
    uAmbientColorLocation = gl.getUniformLocation(shaderProgram, 'uAmbientColor');
    uDiffuseColorLocation = gl.getUniformLocation(shaderProgram, 'uDiffuseColor');
    uSpecularColorLocation = gl.getUniformLocation(shaderProgram, 'uSpecularColor');

    // Enable the attribute arrays
    gl.enableVertexAttribArray(aPositionLocation);
    gl.enableVertexAttribArray(aNormalLocation);

    // Initialize buffers for the sphere and cube
    initSphereBuffer();
    initCubeBuffer();

    gl.enable(gl.DEPTH_TEST);

    // Set up matrices
    mat4.identity(vMatrix);
    mat4.lookAt(eyePos, COI, viewUp, vMatrix);
    mat4.identity(pMatrix);
    mat4.perspective(50, 1.0, 0.1, 1000, pMatrix);

    mat4.identity(mMatrix);

    // transformations applied here on model matrix
    mMatrix = mat4.rotate(mMatrix, degToRad(degree2), [0, 1, 0]);
    mMatrix = mat4.rotate(mMatrix, degToRad(degree3), [1, 0, 0]);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.02, -0.44, 0.1]);
    mMatrix = mat4.scale(mMatrix, [0.325, 0.325, 0.325]);

    diffuseColor = [0.63, 0.63, 0.63];
    drawSphere();
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.39, -0.05, 0.09]);
    mMatrix = mat4.scale(mMatrix, [0.4, 0.4, 0.4]);
    mMatrix = mat4.rotate(mMatrix, 0.2, [1, 0, 0]);
    mMatrix = mat4.rotate(mMatrix, -0.45, [0, 0, 1]);
    mMatrix = mat4.rotate(mMatrix, -0.3, [0, 1, 0]);

    diffuseColor = [0, 0.66, 0];
    drawCube();
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.24, 0.29, 0.19]);
    mMatrix = mat4.scale(mMatrix, [0.195, 0.195, 0.195]);

    diffuseColor = [0.63, 0.63, 0.63];
    drawSphere();
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.01, 0.43, 0.35]);
    mMatrix = mat4.scale(mMatrix, [0.23, 0.23, 0.23]);
    mMatrix = mat4.rotate(mMatrix, 0.4, [1, 0, 0]);
    mMatrix = mat4.rotate(mMatrix, 0.5, [0, 0, 1]);
    mMatrix = mat4.rotate(mMatrix, 0.2, [0, 1, 0]);

    diffuseColor = [0, 0.52, 0];
    drawCube();
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.08, 0.6, 0.42]);
    mMatrix = mat4.scale(mMatrix, [0.1, 0.1, 0.1]);

    diffuseColor = [0.63, 0.63, 0.63];
    drawSphere();
    mMatrix = popMatrix(matrixStack);
}
/////////////////////////////////////////////////////////////////////
// Phong Shading

// Vertex shader code
const perFragVertexShaderCode = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;
uniform mat4 uMMatrix;
uniform mat4 uPMatrix;
uniform mat4 uVMatrix;
uniform mat3 uModelMatrix;

out vec3 PosEyeSpace;
out vec3 normalEyeSpace;

out vec3 L;
out vec3 V;

uniform vec3 uLightPosition;

void main() {
    PosEyeSpace = (uVMatrix * uMMatrix * vec4(aPosition, 1.0)).xyz;
    mat3 uModelMatrix=mat3(uVMatrix * uMMatrix);
    normalEyeSpace = normalize(uModelMatrix * aNormal);

    L = normalize(uLightPosition - PosEyeSpace);
    V = normalize(-PosEyeSpace);

    gl_Position = uPMatrix * uVMatrix * uMMatrix * vec4(aPosition, 1.0);
}`;

// Fragment shader code
const perFragFragShaderCode = `#version 300 es
precision mediump float;
out vec4 fragColor;

in vec3 normalEyeSpace;
in vec3 L;
in vec3 V;
in vec3 vPosEyeSpace;

uniform vec3 uAmbientColor;
uniform vec3 uDiffuseColor;
uniform vec3 uSpecularColor;

void main() {

    vec3 normal = normalEyeSpace;
    vec3 lightVector = L;
    vec3 viewVector = V;

    // Calculate reflection direction
    vec3 reflectionVector = normalize(-reflect(lightVector, normal));

    // Compute Phong shading
    float diffuse = max(dot(normal, lightVector), 0.0);
    float specular = pow(max(dot(reflectionVector, viewVector), 0.0), 32.0);
    float ambient = 0.15;
    vec3 finalcolor = uAmbientColor * ambient + uDiffuseColor * diffuse + uSpecularColor * specular;
    fragColor = vec4(finalcolor, 1.0);
}`;
function drawRightViewport() {
    gl.viewport(800, 0, 400, 400);
    gl.scissor(800, 0, 400, 400);

    gl.clearColor(0.85, 0.95, 0.85, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    shaderProgram = perFragShaderProgram;
    gl.useProgram(shaderProgram);

    // Get locations of attributes and uniforms declared in the shader
    aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");
    aNormalLocation = gl.getAttribLocation(shaderProgram, "aNormal");
    uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");
    uVMatrixLocation = gl.getUniformLocation(shaderProgram, "uVMatrix");
    uPMatrixLocation = gl.getUniformLocation(shaderProgram, "uPMatrix");
    uLightPositionLocation = gl.getUniformLocation(shaderProgram, 'uLightPosition');
    uAmbientColorLocation = gl.getUniformLocation(shaderProgram, 'uAmbientColor');
    uDiffuseColorLocation = gl.getUniformLocation(shaderProgram, 'uDiffuseColor');
    uSpecularColorLocation = gl.getUniformLocation(shaderProgram, 'uSpecularColor');

    // Enable the attribute arrays
    gl.enableVertexAttribArray(aPositionLocation);
    gl.enableVertexAttribArray(aNormalLocation);

    // Initialize buffers for the sphere and cube
    initSphereBuffer();
    initCubeBuffer();

    gl.enable(gl.DEPTH_TEST);
    mat4.identity(vMatrix);
    vMatrix = mat4.lookAt(eyePos, COI, viewUp, vMatrix);

    //set up perspective projection matrix
    mat4.identity(pMatrix);
    mat4.perspective(50, 1.0, 0.1, 1000, pMatrix);

    //set up the model matrix
    mat4.identity(mMatrix);

    // transformations applied here on model matrix
    mMatrix = mat4.rotate(mMatrix, degToRad(degree4), [0, 1, 0]);
    mMatrix = mat4.rotate(mMatrix, degToRad(degree5), [1, 0, 0]);
    
    mMatrix = mat4.rotate(mMatrix, Math.PI / 4, [1, 1, 1]);
    mMatrix = mat4.rotate(mMatrix, -0.6, [0, 0, 1]);
    mMatrix = mat4.rotate(mMatrix, 0.11, [0, 1, 0]);
    mMatrix = mat4.rotate(mMatrix, -0.25, [1, 0, 0]);
    pushMatrix(matrixStack, mMatrix);

    mMatrix = mat4.translate(mMatrix, [0, -0.6, 0.12]);
    mMatrix = mat4.scale(mMatrix, [0.21, 0.21, 0.21]);

    diffuseColor = [0, 0.72, 0.1];
    drawSphere();
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.01, -0.38, 0.1]);
    mMatrix = mat4.scale(mMatrix, [1.23, 0.03, 0.25]);

    diffuseColor = [0.75, 0.3, 0];
    drawCube();

    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.42, -0.22, 0.1]);
    mMatrix = mat4.scale(mMatrix, [0.15, 0.15, 0.15]);

    diffuseColor = [0.16, 0.17, 0.5];
    drawSphere();
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.42, -0.22, 0.1]);
    mMatrix = mat4.scale(mMatrix, [0.15, 0.15, 0.15]);
    diffuseColor = [0.1, 0.42, 0.42];
    drawSphere();
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.42, -0.06, 0.1]);
    mMatrix = mat4.rotate(mMatrix, Math.PI/2, [0, 0, 1]);
    mMatrix = mat4.rotate(mMatrix, Math.PI/2, [0, 1, 0]);
    mMatrix = mat4.rotate(mMatrix, Math.PI/2, [1, 0, 0]);
    mMatrix = mat4.scale(mMatrix, [1, 0.03, 0.3]);

    diffuseColor = [0.7, 0.6, 0.0];
    drawCube();

    mMatrix = popMatrix(matrixStack)

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.42, -0.06, 0.1]);
    mMatrix = mat4.rotate(mMatrix, Math.PI/2, [0, 0, 1]);
    mMatrix = mat4.rotate(mMatrix, Math.PI/2, [0, 1, 0]);
    mMatrix = mat4.rotate(mMatrix, Math.PI/2, [1, 0, 0]);
    mMatrix = mat4.scale(mMatrix, [1, 0.03, 0.3]);

    diffuseColor = [0.1, 0.6, 0.4];
    drawCube();

    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.42, 0.1, 0.1]);
    mMatrix = mat4.scale(mMatrix, [0.15, 0.15, 0.15]);

    diffuseColor = [0.55, 0, 0.55];
    drawSphere();
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.42, 0.1, 0.1]);
    mMatrix = mat4.scale(mMatrix, [0.15, 0.15, 0.15]);

    diffuseColor = [0.5, 0.36, 0.1];
    drawSphere();
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.01, 0.255, 0.1]);
    mMatrix = mat4.scale(mMatrix, [1.23, 0.03, 0.25]);

    diffuseColor = [0.75, 0.3, 0];
    drawCube();

    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0, 0.48, 0.1]);
    mMatrix = mat4.scale(mMatrix, [0.21, 0.21, 0.21]);

    diffuseColor = [0.5, 0.5, 0.59];
    drawSphere();
    mMatrix = popMatrix(matrixStack);

}

//////////////////////////////////////////////////////////////////////

function degToRad(degrees) {
    return (degrees * Math.PI) / 180;
}

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

function initShaders(vertexShaderCode, fragShaderCode) {
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

//init buffers and making sphere and cube
function initSphere(nslices, nstacks, radius) {
    var theta1, theta2;
  
    for (i = 0; i < nslices; i++) {
        spVerts.push(0);
        spVerts.push(-radius);
        spVerts.push(0);
    
        spNormals.push(0);
        spNormals.push(-1.0);
        spNormals.push(0);
    }
  
    for (j = 1; j < nstacks - 1; j++) {
        theta1 = (j * 2 * Math.PI) / nslices - Math.PI / 2;
        for (i = 0; i < nslices; i++) {
            theta2 = (i * 2 * Math.PI) / nslices;
            spVerts.push(radius * Math.cos(theta1) * Math.cos(theta2));
            spVerts.push(radius * Math.sin(theta1));
            spVerts.push(radius * Math.cos(theta1) * Math.sin(theta2));
    
            spNormals.push(Math.cos(theta1) * Math.cos(theta2));
            spNormals.push(Math.sin(theta1));
            spNormals.push(Math.cos(theta1) * Math.sin(theta2));
        }
    }
  
    for (i = 0; i < nslices; i++) {
        spVerts.push(0);
        spVerts.push(radius);
        spVerts.push(0);
    
        spNormals.push(0);
        spNormals.push(1.0);
        spNormals.push(0);
    }
  
    // setup the connectivity and indices
    for (j = 0; j < nstacks - 1; j++) {
        for (i = 0; i <= nslices; i++) {
            var mi = i % nslices;
            var mi2 = (i + 1) % nslices;
            var idx = (j + 1) * nslices + mi;
            var idx2 = j * nslices + mi;
            var idx3 = j * nslices + mi2;
            var idx4 = (j + 1) * nslices + mi;
            var idx5 = j * nslices + mi2;
            var idx6 = (j + 1) * nslices + mi2;
    
            spIndicies.push(idx);
            spIndicies.push(idx2);
            spIndicies.push(idx3);
            spIndicies.push(idx4);
            spIndicies.push(idx5);
            spIndicies.push(idx6);
        }
    }
}
  
function initSphereBuffer() {
    var nslices = 30; // use even number
    var nstacks = nslices / 2 + 1;
    var radius = 1;
    initSphere(nslices, nstacks, radius);
  
    sphereBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spVerts), gl.STATIC_DRAW);
    sphereBuf.itemSize = 3;
    sphereBuf.numItems = nslices * nstacks;
  
    sphereNormalBuf= gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereNormalBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spNormals), gl.STATIC_DRAW);
    sphereNormalBuf.itemSize = 3;
    sphereNormalBuf.numItems = nslices * nstacks;
  
    sphereIndexBuf= gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereIndexBuf);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint32Array(spIndicies),
      gl.STATIC_DRAW
    );
    sphereIndexBuf.itemsize = 1;
    sphereIndexBuf
.numItems = (nstacks - 1) * 6 * (nslices + 1);
}

function drawSphere() {
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuf);
    gl.vertexAttribPointer(
        aPositionLocation,
        sphereBuf.itemSize,
        gl.FLOAT,
        false,
        0,
        0
    );
        
    // draw normal buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereNormalBuf);
    gl.vertexAttribPointer(
        aNormalLocation,
        sphereNormalBuf.itemSize,
        gl.FLOAT,
        false,
        0,
        0
    );

    // draw elementary arrays - triangle indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereIndexBuf);
    gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
    gl.uniformMatrix4fv(uVMatrixLocation, false, vMatrix);
    gl.uniformMatrix4fv(uPMatrixLocation, false, pMatrix);
    gl.uniform3fv(uLightPositionLocation, lightPosition);
    gl.uniform3fv(uAmbientColorLocation, ambientColor);
    gl.uniform3fv(uDiffuseColorLocation, diffuseColor);
    gl.uniform3fv(uSpecularColorLocation, specularColor);
    gl.drawElements(gl.TRIANGLES, sphereIndexBuf.numItems, gl.UNSIGNED_INT, 0);
  //gl.drawArrays(gl.LINE_STRIP, 0, buf.numItems); // show lines
  //gl.drawArrays(gl.POINTS, 0, buf.numItems); // show points
}
function initCubeBuffer() {
    var vertices = [
        // Front face
        -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
        // Back face
        -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
        // Top face
        -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
        // Bottom face
        -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5,
        // Right face
        0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5,
        // Left face
        -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5,
    ];
    cubeBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    cubeBuf.itemSize = 3;
    cubeBuf.numItems = vertices.length / 3;
  
    var normals = [
        // Front face
        0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
        // Back face
        0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
        // Top face
        0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
        // Bottom face
        0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,
        // Right face
        1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
        // Left face
        -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
    ];
    cubeNormalBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    cubeNormalBuf.itemSize = 3;
    cubeNormalBuf.numItems = normals.length / 3;
  
  
    var indices = [
      0,
      1,
      2,
      0,
      2,
      3, // Front face
      4,
      5,
      6,
      4,
      6,
      7, // Back face
      8,
      9,
      10,
      8,
      10,
      11, // Top face
      12,
      13,
      14,
      12,
      14,
      15, // Bottom face
      16,
      17,
      18,
      16,
      18,
      19, // Right face
      20,
      21,
      22,
      20,
      22,
      23, // Left face
    ];
    cubeIndexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuf);
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices),
        gl.STATIC_DRAW
    );
    cubeIndexBuf.itemSize = 1;
    cubeIndexBuf.numItems = indices.length;
}

function drawCube() {
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuf);
    gl.vertexAttribPointer(
        aPositionLocation,
        cubeBuf.itemSize,
        gl.FLOAT,
        false,
        0,
        0
    );
        
    // draw normal buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalBuf);
    gl.vertexAttribPointer(
        aNormalLocation,
        cubeNormalBuf.itemSize,
        gl.FLOAT,
        false,
        0,
        0
    );

    // draw elementary arrays - triangle indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuf);

    // gl.uniform4fv(uColorLocation, color);
    gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
    gl.uniformMatrix4fv(uVMatrixLocation, false, vMatrix);
    gl.uniformMatrix4fv(uPMatrixLocation, false, pMatrix);
    gl.uniform3fv(uLightPositionLocation, lightPosition);
    gl.uniform3fv(uAmbientColorLocation, ambientColor);
    gl.uniform3fv(uDiffuseColorLocation, diffuseColor);
    gl.uniform3fv(uSpecularColorLocation, specularColor);

    gl.drawElements(gl.TRIANGLES, cubeIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
      //gl.drawArrays(gl.LINE_STRIP, 0, buf.numItems); // show lines
  //gl.drawArrays(gl.POINTS, 0, buf.numItems); // show points
}

//Main drawing routine
function drawScene() {
    drawLeftViewport();
    drawMidViewport();
    drawRightViewport();
}

function getViewport(x, y) {
    if (x >= 0 && x <= 400 &&
        y >= -100 && y <= 350) return "left";
    else if (x >= 400 && x <= 800  && 
        y >= -100 && y <= 300) return "mid";
    else if (x >= 800 && x <= 1200 && 
        y >= -100 && y <= 300) return "right";
    return null;
}

function onMouseDown(event) {
    document.addEventListener("mousemove", onMouseMove, false);
    document.addEventListener("mouseup", onMouseUp, false);
    document.addEventListener("mouseout", onMouseOut, false);

    if (
        event.layerX <= canvas.width &&
        event.layerX >= 0 &&
        event.layerY <= canvas.height &&
        event.layerY >= 0
      )  {
        prevMouseX = event.clientX;
        prevMouseY = canvas.height - event.clientY;

        viewport = getViewport(prevMouseX, prevMouseY);
    }
}

function onMouseMove(event) {
    if (
        event.layerX <= canvas.width &&
        event.layerX >= 0 &&
        event.layerY <= canvas.height &&
        event.layerY >= 0
      ) {
    var mouseX = event.clientX;
    var mouseY = canvas.height - event.clientY;

    var diffX = mouseX - prevMouseX;
    var diffY = mouseY - prevMouseY;

    prevMouseX = mouseX;
    prevMouseY = mouseY;

    if (mouseY >= -100 && mouseY <= 300 && viewport !== null) {
        if (viewport === "left") {
            degree0 += diffX / 5;
            degree1 -= diffY / 5;
        } else if (viewport === "mid") {
            degree2 += diffX / 5;
            degree3 -= diffY / 5;
        } else if (viewport === "right") {
            degree4 += diffX / 5;
            degree5 -= diffY / 5;
        }
    }

    drawScene();
    }
}
  
function onMouseUp(event) {
    document.removeEventListener("mousemove", onMouseMove, false);
    document.removeEventListener("mouseup", onMouseUp, false);
    document.removeEventListener("mouseout", onMouseOut, false);
}

function onMouseOut(event) {
    document.removeEventListener("mousemove", onMouseMove, false);
    document.removeEventListener("mouseup", onMouseUp, false);
    document.removeEventListener("mouseout", onMouseOut, false);
}

// This is the entry point from the html
function webGLStart() {
    canvas = document.getElementById("assn2");
    document.addEventListener("mousedown", onMouseDown, false);
    
    const lightSlider = document.getElementById('light-slider');

    const updateLightX = (event) => {
        lightPosition = [parseFloat(event.target.value), 2, 3];
        drawScene();
    };
    
    lightSlider.addEventListener('input', updateLightX);

    const cameraSlider = document.getElementById('camera-slider');

    const updateCameraZ = (event) => {
        const cameraZ = parseFloat(event.target.value);
        eyePos = [0.0, 0.0, cameraZ];
        drawScene();
    };

    cameraSlider.addEventListener('input', updateCameraZ);

    // initialize WebGL
    initGL(canvas);

    // initialize shader program
    flatShaderProgram = initShaders(flatVertexShaderCode, flatFragShaderCode);
    perVertShaderProgram = initShaders(perVertVertexShaderCode, perVertFragShaderCode);
    perFragShaderProgram = initShaders(perFragVertexShaderCode, perFragFragShaderCode);
    drawScene();
}

// 
