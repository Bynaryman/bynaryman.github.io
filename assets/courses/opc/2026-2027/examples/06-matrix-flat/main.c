#include <stdio.h>
#include <stdlib.h>
int main(void) {
    // slide:matrix:begin
    size_t rows = 4, cols = 3;
    int *m = malloc(rows * cols * sizeof *m);
    if (!m) return EXIT_FAILURE;
    for (size_t i = 0; i < rows; ++i)
        for (size_t j = 0; j < cols; ++j)
            m[i * cols + j] = (int)(10 * i + j);
    // slide:matrix:end
    for (size_t i = 0; i < rows; ++i) {
        for (size_t j = 0; j < cols; ++j) printf("%3d", m[i * cols + j]);
        puts("");
    }
    free(m);
    return EXIT_SUCCESS;
}
