#include <stdio.h>
#include <stdlib.h>
int main(void) {
    // slide:matrix:begin
    int rows = 4, cols = 3;
    int **m = malloc(rows * sizeof(int *));
    if (!m) return EXIT_FAILURE;
    int i = 0;
    for (; i < rows; ++i) {
        m[i] = malloc(cols * sizeof(int));
        if (!m[i]) break;
    }
    // slide:matrix:end
    if (i != rows) {
        while (i > 0) free(m[--i]);
        free(m);
        return EXIT_FAILURE;
    }
    for (i = 0; i < rows; ++i) {
        for (int j = 0; j < cols; ++j) {
            m[i][j] = (int)(10 * i + j);
            printf("%3d", m[i][j]);
        }
        puts("");
    }
    for (i = 0; i < rows; ++i) free(m[i]);
    free(m);
    return EXIT_SUCCESS;
}
