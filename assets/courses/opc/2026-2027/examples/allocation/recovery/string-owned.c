#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
    char *s = malloc(6);
    if (!s) return EXIT_FAILURE;
    strcpy(s, "hello");
    printf("%s\n", s);
    free(s);
    return EXIT_SUCCESS;
}
