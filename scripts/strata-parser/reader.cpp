#include <gdstk/gdstk.hpp>
#include <algorithm>
#include <cmath>
#include <cstdint>
#include <cstdlib>

using namespace gdstk;

#define EXPORTED(name) extern "C" __attribute__((export_name(name)))
extern "C" __attribute__((import_module("layout"), import_name("polygon")))
void emit_polygon(uint32_t layer, uint32_t datatype, const Vec2* points, uint32_t count);

extern "C" __attribute__((import_module("layout"), import_name("enter_cell")))
void enter_cell(const char* name, unsigned depth);

// Trap on allocation failure before the native reader writes through a null or truncated pointer.
namespace gdstk {
static size_t checked_size(uint64_t bytes) {
    if (bytes > SIZE_MAX) __builtin_trap();
    return static_cast<size_t>(bytes);
}
static void* checked_pointer(void* pointer, uint64_t bytes) {
    if (!pointer && bytes) __builtin_trap();
    return pointer;
}
void* allocate(uint64_t bytes) { return checked_pointer(std::malloc(checked_size(bytes)), bytes); }
void* allocate_clear(uint64_t bytes) { return checked_pointer(std::calloc(1, checked_size(bytes)), bytes); }
void* reallocate(void* pointer, uint64_t bytes) {
    return checked_pointer(std::realloc(pointer, checked_size(bytes)), bytes);
}
void free_allocation(void* pointer) { std::free(pointer); }
}  // namespace gdstk

namespace {
constexpr uint64_t max_polygons = 150000;
constexpr uint64_t max_points = 1000000;
constexpr uint64_t max_instances = 200000;
constexpr unsigned max_depth = 128;
constexpr const char* polygon_limit = "This cell expands beyond 150,000 polygons.";
constexpr const char* vertex_limit = "This cell expands beyond 1,000,000 polygon vertices.";
constexpr const char* instance_limit = "This cell expands beyond 200,000 cell placements.";

Library library = {};
Array<Cell*> roots = {};
Array<Vec2> transformed = {};
uint64_t polygons = 0, points = 0, instances = 0;

struct Transform {
    double a = 1, b = 0, c = 0, d = 1, x = 0, y = 0;

    Vec2 apply(Vec2 p) const { return {a * p.x + c * p.y + x, b * p.x + d * p.y + y}; }

    Transform child(const Reference& ref, Vec2 offset) const {
        const double co = std::cos(ref.rotation) * ref.magnification;
        const double si = std::sin(ref.rotation) * ref.magnification;
        const double flip = ref.x_reflection ? -1 : 1;
        const Vec2 origin = apply(ref.origin + offset);
        return {a * co + c * si, b * co + d * si, (-a * si + c * co) * flip,
                (-b * si + d * co) * flip, origin.x, origin.y};
    }
};

struct CellCache {
    Array<Polygon*> path_outlines;
    bool visiting;
};

// Check the product before letting the library materialize a regular array's offsets.
template <typename Callback>
const char* for_each_offset(const Repetition& repetition, uint64_t limit, const char* limit_message, Callback callback) {
    if (limit == 0) return limit_message;
    if (repetition.type == RepetitionType::None) return callback(Vec2{0, 0});
    if (repetition.type == RepetitionType::Rectangular || repetition.type == RepetitionType::Regular) {
        if (!repetition.rows || !repetition.columns || repetition.columns > limit / repetition.rows)
            return limit_message;
    }
    if (repetition.get_count() > limit) return limit_message;

    Array<Vec2> offsets = {};
    repetition.get_offsets(offsets);
    const char* error = nullptr;
    for (uint64_t i = 0; !error && i < offsets.count; ++i) error = callback(offsets[i]);
    offsets.clear();
    return error;
}

const char* output_polygon(const Polygon& polygon, const Transform& transform) {
    const uint64_t count = polygon.point_array.count;
    if (count < 3) return nullptr;
    const uint64_t remaining = (max_points - points) / count;
    const uint64_t limit = std::min(max_polygons - polygons, remaining);
    const char* reason = remaining < max_polygons - polygons ? vertex_limit : polygon_limit;
    return for_each_offset(polygon.repetition, limit, reason, [&](Vec2 offset) -> const char* {
        transformed.count = 0;
        transformed.ensure_slots(count);
        for (uint64_t i = 0; i < count; ++i) {
            const Vec2 p = transform.apply(polygon.point_array[i] + offset);
            if (!std::isfinite(p.x) || !std::isfinite(p.y)) return "Layout contains invalid coordinates.";
            transformed.append_unsafe(p);
        }
        emit_polygon(get_layer(polygon.tag), get_type(polygon.tag), transformed.items, count);
        ++polygons;
        points += count;
        return nullptr;
    });
}

const char* visit(Cell* cell, const Transform& transform, unsigned depth) {
    if (++instances > max_instances) return instance_limit;
    if (depth > max_depth) return "The cell hierarchy exceeds 128 levels.";
    // The module is instantiated once per read. Cache path outlines across repeated instances.
    auto* cache = static_cast<CellCache*>(cell->owner);
    if (!cache) {
        cell->owner = cache = static_cast<CellCache*>(allocate_clear(sizeof(CellCache)));
        for (uint64_t i = 0; i < cell->flexpath_array.count; ++i)
            cell->flexpath_array[i]->to_polygons(false, 0, cache->path_outlines);
        for (uint64_t i = 0; i < cell->robustpath_array.count; ++i)
            cell->robustpath_array[i]->to_polygons(false, 0, cache->path_outlines);
    }
    if (cache->visiting) return "Layout contains a circular cell reference.";
    cache->visiting = true;
    enter_cell(cell->name, depth);
    for (auto group : {cell->polygon_array, cache->path_outlines}) {
        for (uint64_t i = 0; i < group.count; ++i)
            if (const char* error = output_polygon(*group[i], transform)) return error;
    }
    for (uint64_t i = 0; i < cell->reference_array.count; ++i) {
        const Reference& ref = *cell->reference_array[i];
        if (ref.type != ReferenceType::Cell) return "Layout refers to a missing cell.";
        const char* error = for_each_offset(ref.repetition, max_instances - instances, instance_limit, [&](Vec2 offset) {
            return visit(ref.cell, transform.child(ref, offset), depth + 1);
        });
        if (error) return error;
    }
    cache->visiting = false;
    return nullptr;
}
}  // namespace

EXPORTED("open_layout") const char* open_layout(int oasis) {
    ErrorCode error = ErrorCode::NoError;
    // All coordinates and the curve approximation tolerance are in micrometres.
    library = oasis ? read_oas("layout", 1e-6, 0.001, &error)
                    : read_gds("layout", 1e-6, 0.001, nullptr, &error);
    if (error == ErrorCode::UnsupportedRecord) return "Layout contains a record this reader does not support.";
    if (error != ErrorCode::NoError && error != ErrorCode::UnofficialSpecification)
        return "Invalid or incomplete layout. Check the file and its cell references.";
    if (library.cell_array.count == 0) return "No cells were found in this layout.";
    Array<RawCell*> raw_roots = {};
    library.top_level(roots, raw_roots);
    return roots.count ? nullptr : "No top-level cell was found. Check for circular references.";
}

EXPORTED("root_count") uint32_t root_count() { return roots.count; }
EXPORTED("root_name") const char* root_name(uint32_t index) { return roots[index]->name; }

EXPORTED("cell_count") uint32_t cell_count() { return library.cell_array.count; }
EXPORTED("cell_name") const char* cell_name(uint32_t index) { return library.cell_array[index]->name; }

EXPORTED("read_cell") const char* read_cell(uint32_t index) {
    if (index >= library.cell_array.count) return "Unknown layout cell.";
    return visit(library.cell_array[index], Transform{}, 0);
}

int main() { return 0; }
