#version 300 es

uniform highp mat3 modelTransform;
uniform highp mat3 viewTransform;
in highp vec2 vertexPosition;
in highp vec3 color;
out highp vec3 vColor;
uniform float currentTime;

out highp vec3 viewPoint;
out highp vec3 positionRelativeToCamera;

void main(void) {
    vec3 v = viewTransform * (modelTransform * vec3(vertexPosition, 1.));
    gl_Position = vec4(v, 1.);
    vColor = color;
}