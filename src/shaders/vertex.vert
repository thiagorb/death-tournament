#version 300 es

uniform highp mat3 modelTransform;
uniform highp mat3 viewTransform;
in highp vec2 vertexPosition;
in highp vec2 vertexNormal;
out highp vec2 vNormal;

void main(void) {
    vNormal = normalize((modelTransform * vec3(vertexNormal, 0.)).xy);
    gl_Position = vec4(viewTransform * modelTransform * vec3(vertexPosition, 1.), 1.);
}