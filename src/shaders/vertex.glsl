#version 300 es

uniform highp mat3 modelTransform;
uniform highp mat3 viewTransform;
in highp vec2 vertexPosition;
in highp vec2 normal;
in highp vec3 color;
out highp vec3 vColor;
out highp vec2 vNormal;
uniform float currentTime;

out highp vec3 viewPoint;
out highp vec3 positionRelativeToCamera;

void main(void) {
    vec3 p = modelTransform * vec3(vertexPosition, 1.);
    vNormal = normalize((modelTransform * vec3(normal, 1.) - p).xy);
    gl_Position = vec4(viewTransform * p, 1.);
    vColor = color;
}