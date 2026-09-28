#include <stdio.h>
#include <stdlib.h>

int main(void) {
    // slide:array:begin
    int count = 4;
    int p[4];
    for (int i = 0; i < count; ++i)
        p[i] = 0;
    printf("first=%d, last=%d\n", p[0], p[count - 1]);
    // slide:array:end
    return EXIT_SUCCESS;
}
