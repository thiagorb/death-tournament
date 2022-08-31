#version 300 es

in highp vec3 vColor;
in highp vec2 vNormal;
out highp vec3 fragColor;

void main(void) {
    highp float brightness = 0.5 + 2. * pow(0.5 + 0.5 * dot(vec2(0., -1.), vNormal), 50.);
    fragColor = vColor * brightness;
}