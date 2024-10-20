cmake_minimum_required(VERSION 3.14)

# Set project name and version
project(VulkanTesting VERSION 1.0)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Include the FetchContent module
include(FetchContent)

# Automatically download and build GLFW
FetchContent_Declare(
    glfw
    GIT_REPOSITORY https://github.com/glfw/glfw.git
    GIT_TAG        latest  # Use the latest stable version
)

# Automatically download and make GLM available
FetchContent_Declare(
    glm
    GIT_REPOSITORY https://github.com/g-truc/glm.git
    GIT_TAG        0.9.9.8  # Or specify the latest release version
)

# Download and configure GLFW and GLM
FetchContent_MakeAvailable(glfw glm)

# Set the source files for your project
add_executable(VulkanTesting
    src/main.cpp  # Adjust to your actual source files
)

# Find Vulkan SDK
find_package(Vulkan REQUIRED)

# Include headers
target_include_directories(VulkanTesting 
    PRIVATE 
    includes 
    ${glm_SOURCE_DIR}
)

# Link Vulkan and GLFW to the project
target_link_libraries(VulkanTesting
    Vulkan::Vulkan
    glfw
    glm
)

# Shader Compilation Function
function(compile_shader shader_file)
    get_filename_component(shader_name ${shader_file} NAME_WE)
    set(output_file "${CMAKE_CURRENT_BINARY_DIR}/shaders/${shader_name}.spv")

    add_custom_command(
        OUTPUT ${output_file}
        COMMAND ${Vulkan_GLSLANG_VALIDATOR_EXECUTABLE} -V ${shader_file} -o ${output_file}
        DEPENDS ${shader_file}
        COMMENT "Compiling ${shader_file} to SPIR-V..."
    )

    # Add the compiled shader to the build target
    set(SHADER_OUTPUTS ${SHADER_OUTPUTS} ${output_file} PARENT_SCOPE)
endfunction()

# Automatically compile all shaders in the 'shaders/' directory
file(GLOB SHADERS "shaders/*.vert" "shaders/*.frag")
foreach(shader ${SHADERS})
    compile_shader(${shader})
endforeach()

# Ensure shaders are part of the final build
add_custom_target(ShadersTarget ALL DEPENDS ${SHADER_OUTPUTS})

# Grab the textures too
file(GLOB TEXTURES "textures/*.*")
foreach(texture ${TEXTURES})
    get_filename_component(texture_name ${texture} NAME)
    set(output_file "${CMAKE_CURRENT_BINARY_DIR}/textures/${texture_name}")

    configure_file(${texture} ${output_file} COPYONLY)
    set(TEXTURE_OUTPUTS ${TEXTURE_OUTPUTS} ${output_file} PARENT_SCOPE)
endforeach()
add_custom_target(TexturesTarget ALL DEPENDS ${TEXTURE_OUTPUTS})

# Ensure the executable depends on the compiled shaders
add_dependencies(VulkanTesting ShadersTarget TexturesTarget)

# Enable multi-threaded compilation for MSVC
if (MSVC)
    target_compile_options(VulkanTesting PRIVATE /MP)
endif()

# Set additional compiler flags
if (CMAKE_CXX_COMPILER_ID STREQUAL "MSVC")
    target_compile_options(VulkanTesting PRIVATE /W4)  # Enable high warning level
else()
    target_compile_options(VulkanTesting PRIVATE -Wall -Wextra -pedantic)
endif()
