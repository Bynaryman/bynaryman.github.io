#include <stdio.h>
#include <stdlib.h>
static void lose_address(void) {
    // slide:bug:begin
    int *p = malloc(4 * sizeof *p);
    if (!p) exit(EXIT_FAILURE);
    for (size_t i = 0; i < 4; ++i)
        p[i] = (int)(10 * (i + 1));
    p = NULL;  // The only address is lost.
    // slide:bug:end
}
int main(void) {
    lose_address();
    puts("Finished");
    return EXIT_SUCCESS;
}
