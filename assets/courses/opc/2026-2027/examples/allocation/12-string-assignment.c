#include <stdio.h>
#include <stdlib.h>
int main(void) {
    char *s = malloc(100);
    if (!s) return EXIT_FAILURE;
    // Intentional error from the original string example.
    s = "hello";  // The allocated block is now unreachable.
    char *p = s;
    s = "bye";
    printf("p=%s; s=%s\n", p, s);
    // Neither pointer now points into the allocated block.
    return EXIT_SUCCESS;
}
