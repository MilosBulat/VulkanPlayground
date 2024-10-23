cmake_minimum_required(VERSION 3.14)

# Set project name and version
project(VulkanTesting VERSION 1.0)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find Vulkan SDK
find_package(Vulkan REQUIRED)

function(CopyFilesFunc root_path file_paths)
    foreach(file_path ${file_paths})
        get_filename_component(file_name ${file_path} NAME)
        set(output_file "${CMAKE_CURRENT_BINARY_DIR}/${root_path}/${file_name}")

        configure_file(${file_path} ${output_file} COPYONLY)

        set(COPY_TEMP ${COPY_TEMP} ${output_file})
    endforeach()

    set(COPY_OUTPUT "${COPY_TEMP}" PARENT_SCOPE)
endfunction()

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

# Fetch ImGui (with Vulkan support)
FetchContent_Declare(
    imgui
    GIT_REPOSITORY https://github.com/ocornut/imgui.git
    GIT_TAG v1.91.4
)

# Download and configure GLFW and GLM
FetchContent_MakeAvailable(glfw glm imgui)

# ImGui source and headers, copy to the main project
file(GLOB IMGUI_SRC_FILES 
    "${imgui_SOURCE_DIR}/*.cpp"
    "${imgui_SOURCE_DIR}/backends/imgui_impl_glfw.cpp"
    "${imgui_SOURCE_DIR}/backends/imgui_impl_win32.cpp"
    "${imgui_SOURCE_DIR}/backends/imgui_impl_vulkan.cpp")

# Set the source files for your project
add_executable(VulkanTesting
    src/main.cpp  # Adjust to your actual source files
    ${IMGUI_SRC_FILES}
)

# Include headers
target_include_directories(VulkanTesting 
    PRIVATE 
    includes
    ${glm_SOURCE_DIR}
    ${imgui_SOURCE_DIR}
    ${imgui_SOURCE_DIR}/backends
)

# Link Vulkan and GLFW to the project
target_link_libraries(VulkanTesting PRIVATE
    Vulkan::Vulkan
    glfw
    glm
)

# Automatically compile all shaders in the 'shaders/' directory
file(GLOB SHADERS "shaders/*.vert" "shaders/*.frag")
foreach(shader ${SHADERS})
    compile_shader(${shader})
endforeach()

# Ensure shaders are part of the final build
add_custom_target(ShadersTarget ALL DEPENDS ${SHADER_OUTPUTS})

# Grab the assets too
file(GLOB ASSETS "assets/*.*")
CopyFilesFunc("assets" "${ASSETS}")
set(ASSET_OUTPUTS "${COPY_OUTPUT}")
add_custom_target(AssetsTarget ALL DEPENDS ${ASSET_OUTPUTS})

# Ensure the executable depends on the compiled shaders
add_dependencies(VulkanTesting ShadersTarget AssetsTarget)

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
