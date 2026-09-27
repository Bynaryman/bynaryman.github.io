#include <stdio.h>
#include <stdlib.h>
int main(void) {
    // slide:runtime:begin
    size_t count;
    if (scanf("%zu", &count) != 1) return EXIT_FAILURE;
    if (count == 0 || count > 1000) return EXIT_FAILURE;
    int *p = malloc(count * sizeof *p);
    if (p == NULL) return EXIT_FAILURE;
    // slide:runtime:end
    for (size_t i = 0; i < count; ++i) p[i] = (int)i;
    printf("Allocated %zu bytes for %zu integers\n", count * sizeof *p, count);
    free(p);
    return EXIT_SUCCESS;
}
