#include <stdio.h>
#include <stdlib.h>
int main(void) {
    // slide:matrix:begin
    int rows = 4, cols = 3;
    int *m = malloc(rows * cols * sizeof(int));
    if (!m) return EXIT_FAILURE;
    for (int i = 0; i < rows; ++i)
        for (int j = 0; j < cols; ++j)
            m[i * cols + j] = (int)(10 * i + j);
    // slide:matrix:end
    for (int i = 0; i < rows; ++i) {
        for (int j = 0; j < cols; ++j) printf("%3d", m[i * cols + j]);
        puts("");
    }
    free(m);
    return EXIT_SUCCESS;
}
