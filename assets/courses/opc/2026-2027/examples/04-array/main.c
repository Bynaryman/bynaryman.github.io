#include <stdio.h>
#include <stdlib.h>
int main(void) {
    // slide:array:begin
    int *a = malloc(4 * sizeof(int));
    if (!a) return EXIT_FAILURE;
    for (int i = 0; i < 4; ++i)
        a[i] = (int)(10 * (i + 1));
    // slide:array:end
    for (int i = 0; i < 4; ++i)
        printf("a[%d]=%d at %p\n", i, a[i], (void *)&a[i]);
    free(a);
    return EXIT_SUCCESS;
}
