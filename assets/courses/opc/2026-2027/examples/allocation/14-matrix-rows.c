#include <stdio.h>
#include <stdlib.h>
int main(void) {
    // slide:matrix:begin
    int *m[4];
    int i = 0;
    for (; i < 4; ++i) {
        m[i] = malloc(3 * sizeof(int));
        if (!m[i]) break;
    }
    // slide:matrix:end
    if (i != 4) {
        while (i > 0) free(m[--i]);
        return EXIT_FAILURE;
    }
    for (i = 0; i < 4; ++i) {
        for (int j = 0; j < 3; ++j) {
            m[i][j] = (int)(10 * i + j);
            printf("%3d", m[i][j]);
        }
        puts("");
    }
    for (i = 0; i < 4; ++i) free(m[i]);
    return EXIT_SUCCESS;
}
