var gl;
var canvas;
var matrixStack = [];
var zAngle = 0.0;
var yAngle = 0.0;
var prevMouseX = 0;
var prevMouseY = 0;

var aPositionLocation;
var aNormalLocation;
var aTexCoordLocation;  
var uVMatrixLocation;
var uMMatrixLocation;
var uPMatrixLocation;
var uWNMatrixLocation;

var objVertexPositionBuffer;
var objVertexNormalBuffer;
var objVertexIndexBuffer;
var objVertexTextureBuffer;

var cubeBuf;
var cubeIndexBuf;
var cubeNormalBuf;
var cubeTexBuf;

var spBuf;
var spIndexBuf;
var spNormalBuf;
var spTexBuf;

var spVerts = [];
var spIndicies = [];
var spNormals = [];
var spTexCoords = [];
var lightPosition = [-1, 2.5, 4];
var ambientColor = [1, 1, 1];
var diffuseColor = [1.0, 1.0, 1.0];
var specularColor = [1.0, 1.0, 1.0];
var cubeMapTexture;
var uTextureLocation;
var vMatrix = mat4.create(); // view matrix
var mMatrix = mat4.create(); // model matrix
var pMatrix = mat4.create(); //projection matrix
var wNMatrix = mat4.create(); // model matrix in world space
var eyePos = [7, 1, 3];
var defaultEyePos = [1, 1, 3];
var uEyePosLocation;
var uLightPositionLocation;
//load files
var input_JSON = "texture/teapot.json";
var cubeMapPath = "texture/Field/";
var posx, posy, posz, negx, negy, negz;
var posx_file = cubeMapPath.concat("posx.jpg");
var posy_file = cubeMapPath.concat("posy.jpg");
var posz_file = cubeMapPath.concat("posz.jpg");
var negx_file = cubeMapPath.concat("negx.jpg");
var negy_file = cubeMapPath.concat("negy.jpg");
var negz_file = cubeMapPath.concat("negz.jpg");
var uTexture2DLocation;
var woodTexture;
var fencetexture;
var earth;
var textureFileCube = "./texture/fence_alpha.png";
var textureFileWood = "./texture/wood_texture.jpg"
var earthfile = "./texture/earthmap2.jpg";
var isAnimating=true;
////////////////////////////////////////////////////////////////////
// For Phong shading, Reflection Mapping, 3D Texture Mapping
const vertexShaderCode = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;
in vec2 aTexCoords;

uniform mat4 uMMatrix;
uniform mat4 uPMatrix;
uniform mat4 uVMatrix;
uniform mat4 uWNMatrix;

out vec3 vwp;
out vec3 vwn;

out vec3 vPosEyeSpace;
out vec3 normalEyeSpace;

out vec3 L;
out vec3 V;

uniform vec3 uLightPosition;

out vec2 fragTexCoord;

void main() {
    mat4 projectionModelView = uPMatrix * uVMatrix * uMMatrix;
    gl_Position =  projectionModelView * vec4(aPosition, 1.0);
    vwp = mat3(uMMatrix) * aPosition;
    vwn = mat3(uWNMatrix) * aNormal;
    gl_PointSize = 1.0;
    vPosEyeSpace = (uVMatrix * uMMatrix * vec4(aPosition, 1.0)).xyz;
    normalEyeSpace = normalize(mat3(uVMatrix * uMMatrix) * aNormal);
    L = normalize(uLightPosition - vPosEyeSpace);
    V = normalize(-vPosEyeSpace);
    fragTexCoord = aTexCoords;
}`;
//////////////////////////////////////////////////////////////
const fragShaderCode= `#version 300 es
precision highp float;

uniform samplerCube cubeMap;
uniform vec3 eyePos;
uniform vec3 uAmbientColor;
uniform vec3 uDiffuseColor;
uniform vec3 uSpecularColor;
uniform sampler2D imageTexture;
uniform float uReflectionFactor;
uniform bool uRefract;

in vec3 vwp;
in vec3 vwn;
in vec3 normalEyeSpace;
in vec3 L;
in vec3 V;
in vec3 vPosEyeSpace;
in vec2 fragTexCoord;

out vec4 fragColor;

void main() {
    vec3 worldNormal = normalize(vwn);
    vec3 eyeToSurfaceDir = normalize(vwp - eyePos);
    vec3 directionReflection = reflect(eyeToSurfaceDir, worldNormal);
    vec3 refractVector = refract(eyeToSurfaceDir, worldNormal, 0.82);
    vec4 cubeMapReflectCol = uRefract ? texture(cubeMap, refractVector) : texture(cubeMap, directionReflection);
    
    vec3 reflectionVector = normalize(-reflect(L, normalEyeSpace));
    float diffuse = max(dot(normalEyeSpace, L), 0.0);
    float specular = pow(max(dot(reflectionVector, V), 0.0), 32.0);
    float ambient = 0.15;
    
    vec3 fColor = uAmbientColor * ambient + uDiffuseColor * diffuse + uSpecularColor * specular;
    vec4 textureColor = texture(imageTexture, fragTexCoord);
    
    if (textureColor.a < 0.3) {
        fragColor = vec4(0, 0, 0, 1);
        discard;
    }
      vec4 refColor = cubeMapReflectCol + vec4(fColor, 1.0);
    fragColor = mix(textureColor, refColor, uReflectionFactor);
}`;
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
function initShaders() {
    shaderProgram = gl.createProgram();
  
    var vertexShader = vertexShaderSetup(vertexShaderCode);
    var fragmentShader = fragmentShaderSetup(fragShaderCode);
  
    // attach the shaders
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    //link the shader program
    gl.linkProgram(shaderProgram);
  
    // check for compiiion and linking status
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
function initTextures(textureFile) {
    var tex = gl.createTexture();
    tex.image = new Image();
    tex.image.src = textureFile;
    tex.image.onload = function () {
        handleTextureLoaded(tex);
    };
    return tex;
}
function handleTextureLoaded(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // use it to flip Y if needed
    gl.texImage2D(
      gl.TEXTURE_2D, // 2D texture
      0, // mipmap level
      gl.RGBA, // internal format
      gl.RGBA, // format
      gl.UNSIGNED_BYTE, // type of data
      texture.image // array or <img>
    );
  
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_LINEAR
    );
  
    drawScene();
    gl.bindTexture(gl.TEXTURE_2D, null);
}
function initSphere(nslices, nstacks, radius) {
    for (var i = 0; i <= nslices; i++) {
      var angle = (i * Math.PI) / nslices;
      var comp1 = Math.sin(angle);
      var comp2 = Math.cos(angle);
  
      for (var j = 0; j <= nstacks; j++) {
        var phi = (j * 2 * Math.PI) / nstacks;
        var comp3 = Math.sin(phi);
        var comp4 = Math.cos(phi);
  
        var xcood = comp4 * comp1;
        var ycoord = comp2;
        var zcoord = comp3 * comp1;
        var utex = 1 - j / nstacks;
        var vtex = 1 - i / nslices;
  
        spVerts.push(radius * xcood, radius * ycoord, radius * zcoord);
        spNormals.push(xcood, ycoord, zcoord);
        spTexCoords.push(utex, vtex);
      }
    }
  
    // now compute the indices here
    for (var i = 0; i < nslices; i++) {
      for (var j = 0; j < nstacks; j++) {
        var id1 = i * (nstacks + 1) + j;
        var id2 = id1 + nstacks + 1;
  
        spIndicies.push(id1, id2, id1 + 1);
        spIndicies.push(id2, id2 + 1, id1 + 1);
      }
    }
}
function initSphereBuffer() {
    var nslices = 50;
    var nstacks = 50;
    var radius = 0.5;
  
    initSphere(nslices, nstacks, radius);
  
    // buffer for vertices
    spBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, spBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spVerts), gl.STATIC_DRAW);
    spBuf.itemSize = 3;
    spBuf.numItems = spVerts.length / 3;
  
    // buffer for indices
    spIndexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, spIndexBuf);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint32Array(spIndicies),
      gl.STATIC_DRAW
    );
    spIndexBuf.itemsize = 1;
    spIndexBuf.numItems = spIndicies.length;
  
    // buffer for normals
    spNormalBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, spNormalBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spNormals), gl.STATIC_DRAW);
    spNormalBuf.itemSize = 3;
    spNormalBuf.numItems = spNormals.length / 3;
  
    // buffer for texture coordinates
    spTexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, spTexBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spTexCoords), gl.STATIC_DRAW);
    spTexBuf.itemSize = 2;
    spTexBuf.numItems = spTexCoords.length / 2;
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
  
    var texCoords = [
        // Front face
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
        // Back face
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
        // Top face
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
        // Bottom face
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
        // Right face
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
        // Left face
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    ];
    cubeTexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeTexBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
    cubeTexBuf.itemSize = 2;
    cubeTexBuf.numItems = texCoords.length / 2;
  
    var indices = [
        0, 1, 2, 0, 2, 3, // Front face
        4, 5, 6, 4, 6, 7, // Back face
        8, 9, 10, 8, 10, 11, // Top face
        12, 13, 14, 12, 14, 15, // Bottom face
        16, 17, 18, 16, 18, 19, // Right face
        20, 21, 22, 20, 22, 23, // Left face
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
function initObject() {
    // XMLHttpRequest objects are used to interact with servers
    // It can be used to retrieve any type of data, not just XML.
    var request = new XMLHttpRequest();
    request.open("GET", input_JSON);
    // MIME: Multipurpose Internet Mail Extensions
    // It lets users exchange different kinds of data files
    request.overrideMimeType("application/json");
    request.onreadystatechange = function () {
        //request.readyState == 4 means operation is done
        if (request.readyState == 4) {
        processObject(JSON.parse(request.responseText));
        }
    };
    request.send();
}
function processObject(objData) {
    objVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, objVertexPositionBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(objData.vertexPositions),
        gl.STATIC_DRAW
    );
    objVertexPositionBuffer.itemSize = 3;
    objVertexPositionBuffer.numItems = objData.vertexPositions.length / 3;

    objVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, objVertexNormalBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(objData.vertexNormals),
        gl.STATIC_DRAW
    );
    objVertexNormalBuffer.itemSize = 3;
    objVertexNormalBuffer.numItems = objData.vertexNormals.length / 3;

    objVertexTextureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, objVertexTextureBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(objData.vertexTextureCoords),
        gl.STATIC_DRAW
    );
    objVertexTextureBuffer.itemSize = 2;
    objVertexTextureBuffer.numItems = objData.vertexTextureCoords.length / 2;

    objVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objVertexIndexBuffer);
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint32Array(objData.indices),
        gl.STATIC_DRAW
    );
    objVertexIndexBuffer.itemSize = 1;
    objVertexIndexBuffer.numItems = objData.indices.length;

    drawScene();
}
function drawObject(color) {
    gl.bindBuffer(gl.ARRAY_BUFFER, objVertexPositionBuffer);
    gl.vertexAttribPointer(
        aPositionLocation,
        objVertexPositionBuffer.itemSize,
        gl.FLOAT,
        false,
        0,
        0
    );
        
    gl.bindBuffer(gl.ARRAY_BUFFER, objVertexNormalBuffer);
    gl.vertexAttribPointer(
        aNormalLocation,
        objVertexNormalBuffer.itemSize,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.bindBuffer(gl.ARRAY_BUFFER, objVertexTextureBuffer);
    gl.vertexAttribPointer(
        aTexCoordLocation,
        objVertexTextureBuffer.itemSize,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objVertexIndexBuffer);
    
    gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
    gl.uniformMatrix4fv(uVMatrixLocation, false, vMatrix);
    gl.uniformMatrix4fv(uPMatrixLocation, false, pMatrix);
    wNMatrix = mat4.transpose(mat4.inverse(mMatrix));
    gl.uniformMatrix4fv(uWNMatrixLocation, false, wNMatrix);

    gl.uniform3fv(uEyePosLocation, eyePos);
    gl.uniform3fv(uLightPositionLocation, lightPosition);

    gl.uniform3fv(uAmbientColorLocation, color);
    gl.uniform3fv(uDiffuseColorLocation, color);
    gl.uniform3fv(uSpecularColorLocation, specularColor);

    // for texture binding
    gl.activeTexture(gl.TEXTURE0); // set texture unit 0 to use
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTexture); // bind the texture object to the texture unit
    gl.uniform1i(uTextureLocation, 0); // pass the texture unit to the shader

    gl.activeTexture(gl.TEXTURE1); // set texture unit 0 to use
    gl.bindTexture(gl.TEXTURE_2D, null); // bind the texture object to the texture unit
    gl.uniform1i(uTexture2DLocation, 1); // pass the texture unit to the shader

    // Set the reflection factor (0.0 to disable reflection, 1.0 for full reflection)
    gl.uniform1f(reflectionFactorLocation, 1.0);  // Enable reflection mapping
    
    refract = false;
    gl.uniform1i(refractLocation, refract ? 1 : 0); // Convert boolean to float (1.0 for true, 0.0 for false)

    gl.drawElements(
        gl.TRIANGLES,
        objVertexIndexBuffer.numItems,
        gl.UNSIGNED_INT,
        0
    );
}
function drawsphere(color){

    gl.bindBuffer(gl.ARRAY_BUFFER, spBuf);
    gl.vertexAttribPointer(
        aPositionLocation,
        spBuf.itemSize,
        gl.FLOAT,
        false,
        0,
        0
    );
    gl.bindBuffer(gl.ARRAY_BUFFER, spNormalBuf);
    gl.vertexAttribPointer(
        aNormalLocation, 
        spNormalBuf.itemSize, 
        gl.FLOAT, false, 
        0, 
        0
    );
        
    gl.bindBuffer(gl.ARRAY_BUFFER, spTexBuf);
    gl.vertexAttribPointer(
        aTexCoordLocation,
        spTexBuf.itemSize,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, spIndexBuf);
    gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
    gl.uniformMatrix4fv(uVMatrixLocation, false, vMatrix);
    gl.uniformMatrix4fv(uPMatrixLocation, false, pMatrix);
    gl.uniformMatrix4fv(uWNMatrixLocation, false, mat4.transpose(mat4.inverse(mMatrix)));

    gl.uniform3fv(uEyePosLocation, eyePos);
    gl.uniform3fv(uLightPositionLocation, lightPosition);

    gl.uniform3fv(uAmbientColorLocation, color);
    gl.uniform3fv(uDiffuseColorLocation, color);
    gl.uniform3fv(uSpecularColorLocation, specularColor);
    gl.drawElements(gl.TRIANGLES, spIndexBuf.numItems, gl.UNSIGNED_INT, 0);
}
function drawcube(color) {
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuf);
    gl.vertexAttribPointer(
        aPositionLocation, 
        cubeBuf.itemSize, 
        gl.FLOAT, 
        false, 
        0, 
        0
    );
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalBuf);
    gl.vertexAttribPointer(
        aNormalLocation, 
        cubeNormalBuf.itemSize, 
        gl.FLOAT, 
        false, 
        0, 
        0
    );
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeTexBuf);
    gl.vertexAttribPointer(
        aTexCoordLocation, 
        cubeTexBuf.itemSize, 
        gl.FLOAT, 
        false, 
        0, 
        0
    );
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuf);

    gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
    gl.uniformMatrix4fv(uVMatrixLocation, false, vMatrix);
    gl.uniformMatrix4fv(uPMatrixLocation, false, pMatrix);
    gl.uniformMatrix4fv(uWNMatrixLocation, false, mat4.transpose(mat4.inverse(mMatrix)));

    gl.uniform3fv(uEyePosLocation, eyePos);
    gl.uniform3fv(uLightPositionLocation, lightPosition);

    gl.uniform3fv(uAmbientColorLocation, color);
    gl.uniform3fv(uDiffuseColorLocation, color);
    gl.uniform3fv(uSpecularColorLocation, specularColor);
    gl.drawElements(gl.TRIANGLES, cubeIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
}
function drawScene() {
    degree = 3.8;
    animate = function() {
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clearColor(0.8, 0.8, 0.8, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        mat4.identity(mMatrix);
        vMatrix = mat4.lookAt(eyePos, [0, 0, 0], [0, 1, 0], vMatrix)
        const theta = degToRad(degree);
        const [x, y, z] = defaultEyePos;
        eyePos[0] = x * Math.cos(theta) - z * Math.sin(theta);
        eyePos[2] = x * Math.sin(theta) + z * Math.cos(theta);
        mat4.lookAt(eyePos, [0, 0, 0], [0, 1, 0], vMatrix);
        degree += 0.1;
        mat4.perspective(74, 1, 1, 10000, pMatrix);
  
        //skybox
        pushMatrix(matrixStack, mMatrix);
        mMatrix = mat4.translate(mMatrix, [0, 0, -200]);
        mMatrix = mat4.rotate(mMatrix, degToRad(180), [0, 0, 1]);
        mMatrix = mat4.scale(mMatrix, [200, 200, 200]);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, negz); 
        gl.uniform1i(uTexture2DLocation, 1); 
        gl.uniform1f(reflectionFactorLocation, 0.1);
        drawcube([0, 0, 0]);
        mMatrix = popMatrix(matrixStack);
        pushMatrix(matrixStack, mMatrix);
        mMatrix = mat4.translate(mMatrix, [0, 0, 200]);
        mMatrix = mat4.rotate(mMatrix, degToRad(180), [1, 0, 0]);
        mMatrix = mat4.scale(mMatrix, [200, 200, 200]);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, posz); 
        gl.uniform1i(uTexture2DLocation, 2); 
        gl.uniform1f(reflectionFactorLocation, 0.1);
        drawcube([0, 0, 0]);
        mMatrix = popMatrix(matrixStack);
        pushMatrix(matrixStack, mMatrix);
        mMatrix = mat4.translate(mMatrix, [-200, 0, 0]);
        mMatrix = mat4.rotate(mMatrix, degToRad(90), [1, 0, 0]);
        mMatrix = mat4.scale(mMatrix, [200, 200, 200]);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, negx); 
        gl.uniform1i(uTexture2DLocation, 1);
        gl.uniform1f(reflectionFactorLocation, 1);
        drawcube([0, 0, 0]);
        mMatrix = popMatrix(matrixStack);
        pushMatrix(matrixStack, mMatrix);
        mMatrix = mat4.translate(mMatrix, [200, 0, 0]);
        mMatrix = mat4.rotate(mMatrix, degToRad(90), [1, 0, 0]);
        mMatrix = mat4.rotate(mMatrix, degToRad(180), [0, 0, 1]);
        mMatrix = mat4.scale(mMatrix, [200, 200, 200]);
        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, posx); 
        gl.uniform1i(uTexture2DLocation, 4); 
        gl.uniform1f(reflectionFactorLocation, 0);
        drawcube([0, 0, 0]);
        mMatrix = popMatrix(matrixStack);
        pushMatrix(matrixStack, mMatrix);
        mMatrix = mat4.translate(mMatrix, [0, -200, 0]);
        mMatrix = mat4.rotate(mMatrix, degToRad(180), [1, 0, 0]);
        mMatrix = mat4.scale(mMatrix, [200, 200, 200]);
        gl.activeTexture(gl.TEXTURE5);
        gl.bindTexture(gl.TEXTURE_2D, negy); 
        gl.uniform1i(uTexture2DLocation, 5); 
        gl.uniform1f(reflectionFactorLocation, 0.1);
        drawcube([0, 0, 0]);
        mMatrix = popMatrix(matrixStack);
        pushMatrix(matrixStack, mMatrix);
        mMatrix = mat4.translate(mMatrix, [0, 700, 0]);
        mMatrix = mat4.scale(mMatrix, [200, 200, 200]);
        gl.activeTexture(gl.TEXTURE6);
        gl.bindTexture(gl.TEXTURE_2D, posy); 
        gl.uniform1i(uTexture2DLocation, 6); 
        gl.uniform1f(reflectionFactorLocation, 0);
        drawcube([0, 0, 0]);
        mMatrix = popMatrix(matrixStack);
        
        //teapot
        mMatrix = mat4.rotate(mMatrix, degToRad(yAngle), [1, 0, 0]);
        mMatrix = mat4.rotate(mMatrix, degToRad(zAngle), [0, 1, 0]);
        pushMatrix(matrixStack, mMatrix);
        mMatrix = mat4.translate(mMatrix, [0.0, 0.8, -0.2]);
        mMatrix = mat4.scale(mMatrix, [0.08, 0.08, 0.08]);
        color = [0, 0, 0];
        specularColor = [0.0, 0.0, 0.0];
        drawObject(color);
        mMatrix = popMatrix(matrixStack);
        
        //earth
        pushMatrix(matrixStack, mMatrix);
        color = [0., 0., 0.];
        mMatrix = mat4.translate(mMatrix, [0.13, 0.5, 1.3]);
        mMatrix = mat4.scale(mMatrix, [0.7, 0.7, 0.7]);
        gl.activeTexture(gl.TEXTURE0); 
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTexture); 
        gl.uniform1i(uTextureLocation, 0); 
        gl.activeTexture(gl.TEXTURE1); 
        gl.bindTexture(gl.TEXTURE_2D, earth); 
        gl.uniform1i(uTexture2DLocation, 1);
        gl.uniform1f(reflectionFactorLocation, 0.5);
        drawsphere(color);
        mMatrix = popMatrix(matrixStack);

        //mirror
        pushMatrix(matrixStack, mMatrix);
        color = [0, 0, 0];
        mMatrix = mat4.translate(mMatrix, [-1, 0.53, 1]);
        mMatrix = mat4.scale(mMatrix, [0.4, 1.1, 0.08]);
        gl.bindTexture(gl.TEXTURE_2D, null); 
        gl.uniform1f(reflectionFactorLocation, 0.99);
        drawcube(color);
        mMatrix = popMatrix(matrixStack);

        //table
        pushMatrix(matrixStack, mMatrix);
        mMatrix = mat4.scale(mMatrix, [5, 0.4, 4]);
        mMatrix = mat4.translate(mMatrix, [0, 0, 0]);
        color = [0, 0, 0];
        gl.activeTexture(gl.TEXTURE1); 
        gl.bindTexture(gl.TEXTURE_2D, woodTexture); 
        gl.uniform1i(uTexture2DLocation, 1);
        gl.uniform1f(reflectionFactorLocation, 0); 
        drawsphere(color);
        mMatrix = popMatrix(matrixStack);
        pushMatrix(matrixStack, mMatrix);
        mMatrix = mat4.translate(mMatrix, [-1.7, -1.55, -1]);
        mMatrix = mat4.scale(mMatrix, [0.2, 3, 0.2]);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTexture);
        gl.uniform1i(uTextureLocation, 0);
        gl.bindTexture(gl.TEXTURE_2D, woodTexture); 
        gl.uniform1f(reflectionFactorLocation, 0);
        drawcube(color);
        mMatrix = popMatrix(matrixStack);
        pushMatrix(matrixStack, mMatrix);
        mMatrix = mat4.translate(mMatrix, [1.7, -1.55, -1]);
        mMatrix = mat4.scale(mMatrix, [0.2, 3, 0.2]);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTexture);
        gl.uniform1i(uTextureLocation, 0);
        gl.bindTexture(gl.TEXTURE_2D, woodTexture); 
        gl.uniform1f(reflectionFactorLocation, 0);
        drawcube(color);
        mMatrix = popMatrix(matrixStack);
        pushMatrix(matrixStack, mMatrix);
        mMatrix = mat4.translate(mMatrix, [-1.7, -1.55, 1]);
        mMatrix = mat4.scale(mMatrix, [0.2, 3, 0.2]);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTexture);
        gl.uniform1i(uTextureLocation, 0);
        gl.bindTexture(gl.TEXTURE_2D, woodTexture); 
        gl.uniform1f(reflectionFactorLocation, 0);
        drawcube(color);
        mMatrix = popMatrix(matrixStack);
        pushMatrix(matrixStack, mMatrix);
        mMatrix = mat4.translate(mMatrix, [1.7, -1.55, 1]);
        mMatrix = mat4.scale(mMatrix, [0.2, 3, 0.2]);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTexture);
        gl.uniform1i(uTextureLocation, 0);
        gl.bindTexture(gl.TEXTURE_2D, woodTexture); 
        gl.uniform1f(reflectionFactorLocation, 0);
        drawcube(color);
        mMatrix = popMatrix(matrixStack);
     
        //fence
        pushMatrix(matrixStack, mMatrix);
        color = [0, 0, 0.3];
        mMatrix = mat4.translate(mMatrix, [1.05, 0.355, 0.6]);
        mMatrix = mat4.scale(mMatrix, [0.34, 0.34, 0.34]);
        gl.activeTexture(gl.TEXTURE0); 
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTexture); 
        gl.uniform1i(uTextureLocation, 0);
        gl.uniform1f(reflectionFactorLocation, 0.9); 
        drawsphere(color);
        mMatrix = popMatrix(matrixStack);
        pushMatrix(matrixStack, mMatrix);
        color = [0, 0, 0];
        mMatrix = mat4.translate(mMatrix, [1.05, 0.355, 0.6]);
        mMatrix = mat4.scale(mMatrix, [0.4, 0.4, 0.4]);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, fencetexture);
        gl.uniform1i(uTexture2DLocation, 1); 
        gl.uniform1f(reflectionFactorLocation, 0.2);
        isReflective = false;
        gl.uniform1i(gl.getUniformLocation(shaderProgram, 'uIsReflective'), isReflective ? 1 : 0);

        drawcube(color);
        mMatrix = popMatrix(matrixStack);
     
        if (isAnimating) {
            animationRequestId = requestAnimationFrame(animate);
        }
    }
    animate();
}    
function onMouseDown(event) {
    isAnimating = false;
    document.addEventListener("mousemove", onMouseMove, false);
    document.addEventListener("mouseup", onMouseUp, false);
    document.addEventListener("mouseout", onMouseOut, false);

    mouseMoved = true;

    if (
        event.layerX <= (canvas.width+600) &&
        event.layerX >= 100 &&
        event.layerY <= canvas.height &&
        event.layerY >= 0
    ) {
        prevMouseX = event.clientX;
        prevMouseY = canvas.height - event.clientY;
    }
}
function onMouseMove(event) {
    // make mouse interaction only within canvas
    if (
        event.layerX <= (canvas.width +600) &&
        event.layerX >= 100 &&
        event.layerY <= canvas.height &&
        event.layerY >= 0
    ) {
        var mouseX = event.clientX;
        var diffX = mouseX - prevMouseX;
        zAngle = zAngle + diffX / 5;
        prevMouseX = mouseX;

        var mouseY = canvas.height - event.clientY;
        var diffY = mouseY - prevMouseY;
        yAngle = yAngle - diffY / 5;
        prevMouseY = mouseY;

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
function webGLStart() {
    canvas = document.getElementById("reflection");
    document.addEventListener("mousedown", onMouseDown, false);

    // Stop the Rotation of the camera
    const stopButton = document.getElementById('stopButton');
    stopButton.addEventListener('click', () => {
        isAnimating = false;
    });

    // Access the start animation button by its ID
    const startAnimationButton = document.getElementById('startAnimationButton');
    startAnimationButton.addEventListener('click', () => { 
        if (!isAnimating) {
            isAnimating = true;
            animate();
        }
        // isAnimating = true;
    });

    initGL(canvas);
    shaderProgram = initShaders();

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");
    aNormalLocation = gl.getAttribLocation(shaderProgram, "aNormal");
    aTexCoordLocation = gl.getAttribLocation(shaderProgram, "aTexCoords");

    uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");
    uPMatrixLocation = gl.getUniformLocation(shaderProgram, "uPMatrix");
    uVMatrixLocation = gl.getUniformLocation(shaderProgram, "uVMatrix");
    uWNMatrixLocation = gl.getUniformLocation(shaderProgram, "uWNMatrix");
    uEyePosLocation = gl.getUniformLocation(shaderProgram, "eyePos");
    uLightPositionLocation = gl.getUniformLocation(shaderProgram, 'uLightPosition');
    uAmbientColorLocation = gl.getUniformLocation(shaderProgram, 'uAmbientColor');
    uDiffuseColorLocation = gl.getUniformLocation(shaderProgram, 'uDiffuseColor');
    uSpecularColorLocation = gl.getUniformLocation(shaderProgram, 'uSpecularColor');

    reflectionFactorLocation = gl.getUniformLocation(shaderProgram, 'uReflectionFactor');
    refractLocation = gl.getUniformLocation(shaderProgram, 'uRefract');

    //enable the attribute arrays
    gl.enableVertexAttribArray(aPositionLocation);
    gl.enableVertexAttribArray(aNormalLocation);
    gl.enableVertexAttribArray(aTexCoordLocation);

    //texture location in shader
    uTextureLocation = gl.getUniformLocation(shaderProgram, "cubeMap");
    uTexture2DLocation = gl.getUniformLocation(shaderProgram, "imageTexture")

    //initialize buffers for the teapot
    initObject();

    // Reflection Mapping
    const targets = [
        gl.TEXTURE_CUBE_MAP_POSITIVE_X,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
        gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
        gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
    ];

    const urls = [posx_file, negx_file, posy_file, negy_file, posz_file, negz_file];

    cubeMapTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTexture);

    targets.forEach((target, index) => {
        gl.texImage2D(target, 0, gl.RGBA, 512, 512, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        
        const image = new Image();
        image.src = urls[index];
        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTexture);
            gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
            drawScene();
        };
    });

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    posx = initTextures(posx_file);
    posy = initTextures(posy_file);
    posz = initTextures(posz_file);
    negz = initTextures(negz_file);
    negx = initTextures(negx_file);
    negy = initTextures(negy_file);
    woodTexture = initTextures(textureFileWood);
    fencetexture = initTextures(textureFileCube);
    earth = initTextures(earthfile);
    initSphereBuffer();
    initCubeBuffer();
}
