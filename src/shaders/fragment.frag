#version 300 es

uniform highp float globalOpacity;
uniform highp vec3 color;
in highp vec2 vNormal;
out highp vec4 fragColor;

void main(void) {
    highp float brightness = 0.5 + 0.5 * max(0., dot(normalize(vec2(0.5, -1.)), vNormal));
    fragColor = vec4(color * brightness, globalOpacity);
    // fragColor = vec4(color * (brightness > 0.6 ? 1.0 : 0.8), globalOpacity);
    // fragColor = vColor;
}