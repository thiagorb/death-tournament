#version 300 es

in highp vec3 vColor;
in highp vec2 vNormal;
out highp vec3 fragColor;

void main(void) {
    highp float brightness = 0.7 + 1. * pow(0.5 + 0.5 * dot(normalize(vec2(-0., -1.)), vNormal), 10.);
    fragColor = vColor * brightness;
    // fragColor = vColor * (brightness > 0.6 ? 1.5 : 1.);
    // fragColor = vColor;
}