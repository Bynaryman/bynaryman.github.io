#include <stdio.h>
#include <stdlib.h>
int main(void) {
    int *p = malloc(sizeof *p);
    if (!p) return EXIT_FAILURE;
    *p = 42;
    free(p);
    // Intentional error: the object no longer exists.
    printf("%d\n", *p);
    return EXIT_SUCCESS;
}
