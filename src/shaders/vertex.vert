#version 300 es

uniform highp mat3 modelTransform;
uniform highp mat3 viewTransform;
in highp vec2 vertexPosition;
in highp vec2 vertexNormal;
out highp vec2 vNormal;

void main(void) {
    vec3 p = modelTransform * vec3(vertexPosition, 1.);
    vNormal = normalize((modelTransform * vec3(vertexNormal, 1.) - p).xy);
    gl_Position = vec4(viewTransform * p, 1.);
}