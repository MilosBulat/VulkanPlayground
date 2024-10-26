#version 450

layout(location = 0) in vec3                inPosition;
layout(location = 1) in vec3                inNormal;
layout(location = 2) in vec3                inTangent;
layout(location = 3) in vec3                inBitangent;
layout(location = 4) in vec2                inTexCoord;
layout(location = 5) in lowp uint           inMatIndex;

layout(location = 0) out vec3               fragPos;
layout(location = 1) out vec2               fragTexCoord;
layout(location = 2) flat out lowp uint     fragMaterialId;
layout(location = 3) out mat3               fragTBN;

layout(binding = 0) uniform VertexDataBufferObject {
    mat4 model;
    mat4 view;
    mat4 proj;
} vertData;

void main() {
    mat4 worldViewProj = vertData.proj * vertData.view * vertData.model;
    gl_Position = worldViewProj * vec4(inPosition, 1.0);

    fragTexCoord = inTexCoord;
    fragMaterialId = inMatIndex;
    fragPos = vec3(vertData.model * vec4(inPosition, 1.0));

    vec3 T = normalize(vec3(vertData.model * vec4(inTangent,   0.0)));
    vec3 N = normalize(vec3(vertData.model * vec4(inNormal,    0.0)));

    // re-orthogonalize T with respect to N
    T = normalize(T - dot(T, N) * N);
    // then retrieve perpendicular vector B with the cross product of T and N
    vec3 B = cross(N, T);

    // vec3 B = normalize(vec3(vertData.model * vec4(inBitangent, 0.0)));
    fragTBN = mat3(T, B, N);
}