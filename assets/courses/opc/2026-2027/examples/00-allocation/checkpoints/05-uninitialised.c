#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int count;
    if (scanf("%d", &count) != 1) return EXIT_FAILURE;
    if (count <= 0 || count > 1000) return EXIT_FAILURE;
    // slide:allocation:begin
    int *p = malloc(count * sizeof(int));
    if (p == NULL) {
        fputs("Allocation failed\n", stderr);
        return EXIT_FAILURE;
    }
    // slide:allocation:end
    // slide:use:begin
    printf("first=%d, last=%d\n", p[0], p[count - 1]);
    // slide:use:end
    free(p);
    return EXIT_SUCCESS;
}
