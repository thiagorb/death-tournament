#version 300 es

in highp vec3 vColor;
out highp vec3 fragColor;

void main(void) {
    fragColor = vColor;
}