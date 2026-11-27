const std = @import("std");

pub fn build(b: *std.Build) void {
    const exe = b.addExecutable(.{
        .name = "layout-reader",
        .root_module = b.createModule(.{
            .target = b.standardTargetOptions(.{}),
            .optimize = b.standardOptimizeOption(.{ .preferred_optimize_mode = .ReleaseSmall }),
        }),
    });
    exe.addIncludePath(b.path("vendor/gdstk/include"));
    exe.addIncludePath(b.path("vendor/gdstk/external"));
    exe.addIncludePath(b.path("vendor/miniz"));
    exe.addIncludePath(b.path("src/qhull_stub"));
    exe.addCSourceFiles(.{
        .files = &.{
            "reader.cpp",
            "vendor/gdstk/src/cell.cpp", "vendor/gdstk/src/clipper_tools.cpp",
            "vendor/gdstk/src/curve.cpp", "vendor/gdstk/src/flexpath.cpp",
            "vendor/gdstk/src/gdsii.cpp", "vendor/gdstk/src/label.cpp",
            "vendor/gdstk/src/library.cpp", "vendor/gdstk/src/oasis.cpp",
            "vendor/gdstk/src/polygon.cpp", "vendor/gdstk/src/property.cpp",
            "vendor/gdstk/src/rawcell.cpp", "vendor/gdstk/src/reference.cpp",
            "vendor/gdstk/src/repetition.cpp", "vendor/gdstk/src/robustpath.cpp",
            "vendor/gdstk/src/style.cpp", "vendor/gdstk/src/utils.cpp",
            "vendor/gdstk/external/clipper/clipper.cpp",
        },
        .flags = &.{ "-std=c++17", "-fno-rtti", "-DGDSTK_NO_PYTHON", "-DGDSTK_CUSTOM_ALLOCATOR", "-fno-sanitize=alignment" },
    });
    exe.addCSourceFile(.{ .file = b.path("vendor/miniz/miniz.c"), .flags = &.{} });
    exe.linkLibC();
    exe.linkLibCpp();
    exe.entry = .disabled;
    exe.root_module.strip = true;
    exe.stack_size = 4 * 1024 * 1024;
    exe.max_memory = 256 * 1024 * 1024;
    b.installArtifact(exe);
}
