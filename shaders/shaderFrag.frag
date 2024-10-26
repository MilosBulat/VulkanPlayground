#version 450
#extension GL_EXT_nonuniform_qualifier : require

#define PI 3.14159265359

layout(location = 0) in vec3                fragPos;
layout(location = 1) in vec2                fragTexCoord;
layout(location = 2) flat in lowp uint      fragMaterialId;
layout(location = 3) in mat3                fragTBN;

layout(location = 0) out vec4               outColor;

layout(binding = 1) uniform SceneComponentsObj {
    vec3            lightPos;
    vec3            camPos;
    float           padding[5];
} scene;

layout(binding = 2) uniform MaterialBufferObject {
    uint        colorTextureId;
    uint        normalTextureId;
    uint        metallicTextureId;
    uint        roughnessTextureId;
    uint        specularTextureId;
    uint        padding[11];
} materials[];

layout(binding = 3) uniform sampler2D       texSampler[];

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
    vec3 lightVector      = normalize(scene.lightPos - fragPos);
    vec3 viewVector       = normalize(scene.camPos - fragPos);

    uint colorID          = materials[fragMaterialId].colorTextureId;
    vec4 diffuseColor     = texture(texSampler[colorID], fragTexCoord);

    uint normalID         = materials[fragMaterialId].normalTextureId;
    vec3 normalColor      = texture(texSampler[normalID], fragTexCoord).rgb;
    vec3 tangentNormal    = normalize(normalColor * 2.0 - 1.0);
    vec3 normal           = normalize(fragTBN * tangentNormal);

    uint roughnessID      = materials[fragMaterialId].roughnessTextureId;
    float roughness       = texture(texSampler[roughnessID], fragTexCoord).r;

    uint metallicID      = materials[fragMaterialId].metallicTextureId;
    float metallicAmount = 0;
    if (metallicID < 100)
        metallicAmount = texture(texSampler[metallicID], fragTexCoord).r;

    uint specularID      = materials[fragMaterialId].specularTextureId;
    float specularAmount = 0;
    if (specularID < 100)
        specularAmount = texture(texSampler[specularID], fragTexCoord).r;

    vec3 halfVector       = normalize(viewVector + lightVector);

    float NoV             = abs(dot(normal, viewVector)) + 1e-5;
    float NoL             = clamp(dot(normal, lightVector), 0.0, 1.0);
    float NoH             = clamp(dot(normal, halfVector), 0.0, 1.0);
    float LoH             = clamp(dot(lightVector, halfVector), 0.0, 1.0);

    vec3 f0 = vec3(0.04);
    f0 = mix(f0, diffuseColor.rgb, metallicAmount);
    vec3 outSpecular = cookTorranceBRDF(NoH, NoV, NoL, LoH, f0, roughness);
    outSpecular *= metallicAmount;
    
    float ambientStrength = 0.2;
    vec4 outDiffuse = vec4((1.0 - metallicAmount) * diffuseColor.rgb, diffuseColor.a); // Calculate metallic influence
    outDiffuse *= (Diffuse_Lambert() + ambientStrength);


    if (outDiffuse.a > 0)
        outColor = vec4(outDiffuse.rgb + outSpecular.rgb, outDiffuse.a);
    else
        outColor = vec4(0.0);

    // vec3 tempColor = outDiffuse.rgb + outSpecular.rgb;
    // outColor = roughness;
    // outColor = vec4(fragTBN[1] * 0.5 + 0.5, 1.0);
    // outColor = vec4(roughness, 1.0);
    // outColor = vec4(metallicAmount, 0.0, 0.0, 1.0);
}