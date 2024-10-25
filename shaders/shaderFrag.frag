#version 450
#extension GL_EXT_nonuniform_qualifier : require

layout(location = 0) in vec3                fragColor;
layout(location = 1) in vec2                fragTexCoord;
layout(location = 2) flat in lowp uint      fragMaterialId;

layout(location = 0) out vec4               outColor;

layout(binding = 1) uniform sampler2D       texSampler[];

layout(binding = 2) uniform MaterialBufferObject {
    lowp uint        colorTextureId;
    lowp uint        normalTextureId;
    lowp uint        metallicTextureId;
    float            padding[5];
} materials[];

void main() {
    uint colorTexId = materials[fragMaterialId].colorTextureId;
    outColor = texture(texSampler[colorTexId], fragTexCoord);
}