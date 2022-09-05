#version 300 es

uniform highp float globalOpacity;
uniform highp vec3 color;
in highp vec2 vNormal;
out highp vec4 fragColor;

void main(void) {
    highp float brightness = 0.75 + 0.25 * dot(normalize(vec2(-0.5, -1.)), vNormal);
    fragColor = vec4(color * brightness, globalOpacity);
    // fragColor = vColor * (brightness > 0.6 ? 1.5 : 1.);
    // fragColor = vColor;
}