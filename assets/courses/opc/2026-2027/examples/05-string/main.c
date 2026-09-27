#include <stdio.h>
#include <stdlib.h>
#include <string.h>
int main(void) {
    // slide:string:begin
    char *s = malloc(4 * sizeof *s);
    if (!s) return EXIT_FAILURE;
    strcpy(s, "cat");  // Three letters and the terminator.
    // slide:string:end
    for (size_t i = 0; i < 4; ++i)
        printf("s[%zu] = %u\n", i, (unsigned char)s[i]);
    puts(s);
    free(s);
    return EXIT_SUCCESS;
}
