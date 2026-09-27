#include <stdio.h>
#include <stdlib.h>
int main(void) {
    // slide:bug:begin
    int *a = malloc(4 * sizeof *a);
    if (!a) return EXIT_FAILURE;
    printf("a[0] = %d\n", a[0]);
    // slide:bug:end
    free(a);
    return EXIT_SUCCESS;
}
