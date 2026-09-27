#include <stdio.h>
#include <stdlib.h>
int main(void) {
    // slide:bug:begin
    int *a = malloc(4 * sizeof *a);
    if (!a) return EXIT_FAILURE;
    for (size_t i = 0; i <= 4; ++i)
        a[i] = (int)(10 * (i + 1));
    // slide:bug:end
    printf("a[0] = %d\n", a[0]);
    free(a);
    return EXIT_SUCCESS;
}
