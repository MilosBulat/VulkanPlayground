#version 450
#extension GL_EXT_nonuniform_qualifier : require

#define PI 3.14159265359

layout(location = 0) in vec3                fragColor;
layout(location = 1) in vec2                fragTexCoord;
layout(location = 2) flat in lowp uint      fragMaterialId;

layout(location = 0) out vec4               outColor;

layout(binding = 1) uniform sampler2D       texSampler[];

layout(binding = 2) uniform MaterialBufferObject {
    lowp uint        colorTextureId;
    lowp uint        normalTextureId;
    lowp uint        metallicTextureId;
    lowp uint        roughnessTextureId;
    float            padding[4];
} materials[];

layout(binding = 3) uniform SceneComponentsObj {
    vec3            lightVector;
    vec3            viewVector;
} scene;

// Fresnel-Schlick approximation
vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

// Normal Distribution Function (GGX)
float NormalDistibutionGGX(float NoH, float a) {
    float a2 = a * a;
    float f = (NoH * a2 - NoH) * NoH + 1.0;
    return a2 / (PI * f * f);
}

// Fresnel Schlick
vec3 FresnelSchlick(float u, vec3 f0) {
    return f0 + (vec3(1.0) - f0) * pow(1.0 - u, 5.0);
}

// Geometry Function (Smith Schlick-GGX)
float SmithGGXCorrelated(float NoV, float NoL, float a) {
    float a2 = a * a;
    float GGXL = NoV * sqrt((-NoL * a2 + NoL) * NoL + a2);
    float GGXV = NoL * sqrt((-NoV * a2 + NoV) * NoV + a2);
    return 0.5 / (GGXV + GGXL);
}

// Cook-Torrance BRDF
vec3 cookTorranceBRDF(float NoH, float NoV, float NoL, float LoH, vec3 f0, float roughness) {
    float D = NormalDistibutionGGX(NoH, roughness);
    vec3  F = FresnelSchlick(LoH, f0);
    float V = SmithGGXCorrelated(NoV, NoL, roughness);

    return (D * V) * F;
}

float Diffuse_Lambert() {
    return 1.0 / PI;
}

void main() {
    vec4 diffuseColor   = texture(texSampler[materials[fragMaterialId].colorTextureId], fragTexCoord);
    vec4 normal         = texture(texSampler[materials[fragMaterialId].normalTextureId], fragTexCoord);
    vec4 roughness      = texture(texSampler[materials[fragMaterialId].roughnessTextureId], fragTexCoord);

//    vec3 halfVector = normalize(viewVector + lightVector);
//
//    float NoV = abs(dot(normal, viewVector)) + 1e-5;
//    float NoL = clamp(dot(normal, lightVector), 0.0, 1.0);
//    float NoH = clamp(dot(normal, halfVector), 0.0, 1.0);
//    float LoH = clamp(dot(lightVector, halfVector), 0.0, 1.0);
//
//    vec3 specular       = cookTorranceBRDF(vec3(normal));
    
    outColor = diffuseColor * Diffuse_Lambert();
}