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

# Include GLM headers (since it’s header-only, no linking needed)
target_include_directories(VulkanTesting PRIVATE ${glm_SOURCE_DIR})

# Link Vulkan and GLFW to the project
target_link_libraries(VulkanTesting
    Vulkan::Vulkan
    glfw
    glm
)

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
