#include <stdio.h>
#include <stdlib.h>

int main(void) {
    // slide:capacity:begin
    size_t count;
    int p[4];
    if (scanf("%zu", &count) != 1) return EXIT_FAILURE;
    if (count == 0 || count > 4) {
        fputs("Choose 1 to 4: the array has four elements.\n", stderr);
        return EXIT_FAILURE;
    }
    // slide:capacity:end
    for (size_t i = 0; i < count; ++i)
        p[i] = 0;
    printf("first=%d, last=%d\n", p[0], p[count - 1]);
    return EXIT_SUCCESS;
}
