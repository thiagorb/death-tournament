#version 300 es

precision highp float;
uniform highp mat4 model;
uniform highp float currentTime;
uniform highp mat4 viewPosition;
uniform highp vec3 skyColor;
in highp vec3 vColor;
in highp vec3 vNormal;
in highp vec3 worldPosition;
in highp vec3 viewPoint;
in highp vec3 positionRelativeToCamera;
out highp vec3 fragColor;
highp vec3 viewDir;
highp vec3 lightDir;
uniform sampler2D perlinSampler;
float waveHeight = 0.05;

float waterShift(float x, float y) {
    return waveHeight * cos((currentTime) * 3.14159265 * 0.001 + texture(perlinSampler, vec2(x / 5., y / 5.)).x * 10.);
}

vec3 getIntersectionWithPlane(vec3 point, float z) {
    return vec3(point - positionRelativeToCamera * (point.z + z) / positionRelativeToCamera.z);
}

float calculateSpecular(vec3 normal, float focus, float strength) {
    vec3 reflectDir = reflect(-lightDir, normal);
    return strength * pow(max(dot(viewDir, reflectDir), 0.0), focus);
}

float waterTurbidity(vec3 distance) {
    return pow(clamp(1.0 - 0.5 / pow(length(distance), 1.), 0., 1.), 2.);
}

void main(void) {
    viewDir = normalize(positionRelativeToCamera);
    lightDir = normalize(vec3(4.0, 3.0, 8. * cos(currentTime * 0.001) + 10.0));

    vec3 lightColor = vec3(1.0);
    // ambient
    vec3 ambient = 0.1 * lightColor;
    // diffuse
    float diff = max(dot(lightDir, vNormal), 0.0);
    vec3 diffuse = 0.8 * diff * lightColor;
    // specular
    float spec = 0.0;
    spec = calculateSpecular(vNormal, 40.0, 1.0);
    vec3 specular = 0.3 * spec * lightColor;    
    
    fragColor = (ambient + diffuse + specular) * vColor;

    float waterFactor = waterShift(worldPosition.x, worldPosition.y);


    float waterBlend = clamp(-worldPosition.z, 0., 1.);

    vec3 intersectionWithPlane0 = getIntersectionWithPlane(worldPosition, 0.);
    vec3 waterColor = vec3(0.0, 0.4, 0.3);
    if (viewPoint.z <= waveHeight) {
        fragColor = mix(
            fragColor,
            waterColor,
            waterTurbidity(viewPoint - (worldPosition.z >= waveHeight ? intersectionWithPlane0 : worldPosition))
        );

        return;
    }
    
    if (worldPosition.z >= waterFactor) {
        return;
    }
    
    float waterShiftSample = 1.;
    vec3 intersectionWithWater = getIntersectionWithPlane(intersectionWithPlane0, waterShift(intersectionWithPlane0.x, intersectionWithPlane0.y));
    float s0 = waterShift(intersectionWithWater.x, intersectionWithWater.y);
    float s1 = waterShift(intersectionWithWater.x + waterShiftSample, intersectionWithWater.y);
    float s2 = waterShift(intersectionWithWater.x, intersectionWithWater.y + waterShiftSample);
    vec3 normal = normalize(cross(normalize(vec3(waterShiftSample, 0., s1 - s0)), normalize(vec3(0., waterShiftSample, s2 - s0))));

    float colorGloss = calculateSpecular(normal, 5., 0.8);
    float waterReflectionFactor = pow(clamp(1. - dot(normal, normalize(viewPoint - intersectionWithWater)), 0., 1.), 7.);

    fragColor = mix(
        mix(
            mix(
                fragColor,
                waterColor,
                waterBlend * waterTurbidity(intersectionWithPlane0 - worldPosition)
            ),
            skyColor,
            waterBlend * waterReflectionFactor
        ),
        vec3(1.0, 1.0, 1.0), 
        waterBlend * colorGloss
    );
}