function multiplyMatrices(matrixA, matrixB) {
    var result = [];

    for (var i = 0; i < 4; i++) {
        result[i] = [];
        for (var j = 0; j < 4; j++) {
            var sum = 0;
            for (var k = 0; k < 4; k++) {
                sum += matrixA[i * 4 + k] * matrixB[k * 4 + j];
            }
            result[i][j] = sum;
        }
    }

    // Flatten the result array
    return result.reduce((a, b) => a.concat(b), []);
}
function createIdentityMatrix() {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
}
function createScaleMatrix(scale_x, scale_y, scale_z) {
    return new Float32Array([
        scale_x, 0, 0, 0,
        0, scale_y, 0, 0,
        0, 0, scale_z, 0,
        0, 0, 0, 1
    ]);
}

function createTranslationMatrix(x_amount, y_amount, z_amount) {
    return new Float32Array([
        1, 0, 0, x_amount,
        0, 1, 0, y_amount,
        0, 0, 1, z_amount,
        0, 0, 0, 1
    ]);
}

function createRotationMatrix_Z(radian) {
    return new Float32Array([
        Math.cos(radian), -Math.sin(radian), 0, 0,
        Math.sin(radian), Math.cos(radian), 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ])
}

function createRotationMatrix_X(radian) {
    return new Float32Array([
        1, 0, 0, 0,
        0, Math.cos(radian), -Math.sin(radian), 0,
        0, Math.sin(radian), Math.cos(radian), 0,
        0, 0, 0, 1
    ])
}

function createRotationMatrix_Y(radian) {
    return new Float32Array([
        Math.cos(radian), 0, Math.sin(radian), 0,
        0, 1, 0, 0,
        -Math.sin(radian), 0, Math.cos(radian), 0,
        0, 0, 0, 1
    ])
}

function getTransposeMatrix(matrix) {
    return new Float32Array([
        matrix[0], matrix[4], matrix[8], matrix[12],
        matrix[1], matrix[5], matrix[9], matrix[13],
        matrix[2], matrix[6], matrix[10], matrix[14],
        matrix[3], matrix[7], matrix[11], matrix[15]
    ]);
}

const vertexShaderSource = `
attribute vec3 position;
attribute vec3 normal; // Normal vector for lighting

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 normalMatrix;

uniform vec3 lightDirection;

varying vec3 vNormal;
varying vec3 vLightDirection;

void main() {
    vNormal = vec3(normalMatrix * vec4(normal, 0.0));
    vLightDirection = lightDirection;

    gl_Position = vec4(position, 1.0) * projectionMatrix * modelViewMatrix; 
}

`

const fragmentShaderSource = `
precision mediump float;

uniform vec3 ambientColor;
uniform vec3 diffuseColor;
uniform vec3 specularColor;
uniform float shininess;

varying vec3 vNormal;
varying vec3 vLightDirection;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(vLightDirection);
    
    // Ambient component
    vec3 ambient = ambientColor;

    // Diffuse component
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * diffuseColor;

    // Specular component (view-dependent)
    vec3 viewDir = vec3(0.0, 0.0, 1.0); // Assuming the view direction is along the z-axis
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    vec3 specular = spec * specularColor;

    gl_FragColor = vec4(ambient + diffuse + specular, 1.0);
}

`

/**
 * @WARNING DO NOT CHANGE ANYTHING ABOVE THIS LINE
 */



/**
 * 
 * @TASK1 Calculate the model view matrix by using the chatGPT
 */

function getChatGPTModelViewMatrix() {
    const transformationMatrix = new Float32Array([
        0.6125, -0.4243, 0.667, 0.3,
        0.7217, 0.379, 0.5791, -0.25,
        -0.3182, 0.8246, 0.4685, 0,
        0, 0, 0, 1

    ]);
    return getTransposeMatrix(transformationMatrix);
}


/**
 * 
 * @TASK2 Calculate the model view matrix by using the given 
 * transformation methods and required transformation parameters
 * stated in transformation-prompt.txt
 */
function getModelViewMatrix() {
    
    const radX = 30 * (Math.PI / 180);
    const radY = 45 * (Math.PI / 180);
    const radZ = 60 * (Math.PI / 180);

    const rotX = createRotationMatrix_X(radX);
    const rotY = createRotationMatrix_Y(radY);
    const rotZ = createRotationMatrix_Z(radZ);
    const scale = createScaleMatrix(0.5, 0.5, 1.0); 
    const translation = createTranslationMatrix(0.3, -0.25, 0);

    
    var viewMatrix = multiplyMatrices(createIdentityMatrix(), translation)
    viewMatrix = multiplyMatrices(viewMatrix, scale);

    var combinedRot = multiplyMatrices(rotX, rotY);
    combinedRot = multiplyMatrices(combinedRot, rotZ);
    viewMatrix = multiplyMatrices(viewMatrix, combinedRot);
    
    return viewMatrix;
}




/**
 * 
 * @TASK3 Ask CHAT-GPT to animate the transformation calculated in 
 * task2 infinitely with a period of 10 seconds. 
 * First 5 seconds, the cube should transform from its initial 
 * position to the target position.
 * The next 5 seconds, the cube should return to its initial position.
 */



function getPeriodicMovement(startTime) {
    const animationDuration = 10 * 1000; // 10 seconds in milliseconds
    const animationHalfDuration = animationDuration / 2;
    // Set the initial position matrix as an identity matrix (original position)
    const initialPositionMatrix = createIdentityMatrix();

    const elapsedTime = (Date.now() - startTime) % animationDuration;
    
    // Calculate the normalized time in the range [0, 1] for animation
    const normalizedTime = elapsedTime / animationDuration;

    // Calculate the rotation angles and translation values based on normalizedTime
    let radX, radY, radZ, tx, ty, tz, sx, sy, sz;

    if (normalizedTime <= 0.5) {
        // During the first 5 seconds (0-0.5), animate from origin to target position with scaling
        const progress = normalizedTime * 2; // Scale to [0, 1]

        radX = 30 * (Math.PI / 180) * progress;
        radY = 45 * (Math.PI / 180) * progress;
        radZ = 60 * (Math.PI / 180) * progress;
        tx = 0.3 * progress;
        ty = -0.25 * progress;
        tz = 0;
        sx = 1.0 - 0.5 * progress; // Scale x-axis from 1.0 to 0.5 (vice versa)
        sy = 1.0 - 0.5 * progress; // Scale y-axis from 1.0 to 0.5 (vice versa)
        sz = 1.0; // No scaling along the z-axis
    } else {
        // During the next 5 seconds (0.5-1.0), animate from target back to origin with scaling
        const progress = (normalizedTime - 0.5) * 2; // Scale to [0, 1]

        radX = 30 * (Math.PI / 180) * (1 - progress);
        radY = 45 * (Math.PI / 180) * (1 - progress);
        radZ = 60 * (Math.PI / 180) * (1 - progress);
        tx = 0.3 - 0.3 * progress;
        ty = -0.25 + 0.25 * progress;
        tz = 0;
        sx = 0.5 + 0.5 * progress; // Scale x-axis from 0.5 to 1.0 (vice versa)
        sy = 0.5 + 0.5 * progress; // Scale y-axis from 0.5 to 1.0 (vice versa)
        sz = 1.0; // No scaling along the z-axis
    }

    // Calculate the transformation matrices based on the calculated angles, scaling, and translations
    const rotX = createRotationMatrix_X(radX);
    const rotY = createRotationMatrix_Y(radY);
    const rotZ = createRotationMatrix_Z(radZ);
    const scale = createScaleMatrix(sx, sy, sz);
    const translation = createTranslationMatrix(tx, ty, tz);

    // Combine the transformation matrices to create the view matrix
    let viewMatrix = initialPositionMatrix;
    viewMatrix = multiplyMatrices(viewMatrix, translation);
    viewMatrix = multiplyMatrices(viewMatrix, scale);
    viewMatrix = multiplyMatrices(viewMatrix, rotX);
    viewMatrix = multiplyMatrices(viewMatrix, rotY);
    viewMatrix = multiplyMatrices(viewMatrix, rotZ);

    return viewMatrix;
}










