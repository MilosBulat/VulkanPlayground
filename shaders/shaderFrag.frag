#version 450

layout(location = 0) in vec3                fragColor;
layout(location = 1) in vec2                fragTexCoord;
layout(location = 2) flat in lowp uint      fragMaterialId;

layout(location = 0) out vec4               outColor;

layout(binding = 1) uniform sampler2D       texSampler[];

void main() {

    if (fragMaterialId == 4)
    {
        outColor = texture(texSampler[2], fragTexCoord);
    }
    else
        outColor = vec4(0.8f, 0.8f, 0.8f, 1.0f);
}