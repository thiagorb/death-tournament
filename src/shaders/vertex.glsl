#version 300 es

uniform highp mat4 view;
uniform highp mat4 projection;
uniform highp mat4 model;
uniform highp mat4 viewPosition;
in highp vec3 vertexPosition;
in highp vec3 color;
out highp vec3 vColor;
in highp vec3 normal;
out highp vec3 vNormal;
out highp vec3 worldPosition;
uniform float currentTime;

out highp vec3 viewPoint;
out highp vec3 positionRelativeToCamera;

void main(void) {
    worldPosition = (model * vec4(vertexPosition, 1.)).xyz;
    viewPoint = (-viewPosition * vec4(0, 0, 0, 1)).xyz;

    positionRelativeToCamera = viewPoint - worldPosition;

    gl_Position = projection * view * vec4(worldPosition, 1.0);
    vColor = color;

    vNormal = normalize((model * vec4(vertexPosition + normal, 1)).xyz - (model * vec4(vertexPosition, 1)).xyz);
}