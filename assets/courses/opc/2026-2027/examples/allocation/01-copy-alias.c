#include <stdio.h>
#include <stdlib.h>

int main(void) {
    // slide:alias:begin
    char original[] = "hello";
    char *copy = original;

    copy[0] = 'H';
    printf("original: %s\n", original);
    printf("copy:     %s\n", copy);
    // slide:alias:end
    return EXIT_SUCCESS;
}
