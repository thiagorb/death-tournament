#version 300 es

in highp vec3 vColor;
in highp vec2 vNormal;
out highp vec3 fragColor;

void main(void) {
    // highp float brightness = 0.5 + 3. * pow(0.5 + 0.5 * dot(normalize(vec2(-100., 111.)), vNormal), 50.);
    // fragColor = vColor * brightness;
    // fragColor = vColor * (brightness > 0.6 ? 1.5 : 1.);
    fragColor = vColor;
}