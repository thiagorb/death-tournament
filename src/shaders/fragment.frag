#version 300 es

uniform highp float globalOpacity;
in highp vec3 vColor;
in highp vec2 vNormal;
out highp vec4 fragColor;

void main(void) {
    highp float brightness = 0.75 + 0.25 * dot(normalize(vec2(-0.5, -1.)), vNormal);
    fragColor = vec4(vColor * brightness, globalOpacity);
    // fragColor = vColor * (brightness > 0.6 ? 1.5 : 1.);
    // fragColor = vColor;
}