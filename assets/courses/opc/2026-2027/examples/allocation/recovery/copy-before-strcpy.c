#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
    char original[] = "hello";
    // slide:allocation:begin
    char *copy = malloc(strlen(original));
    if (copy == NULL)
        return EXIT_FAILURE;
    // slide:allocation:end

    // slide:copy:begin
    copy[0] = 'H';
    printf("original: %s\n", original);
    printf("copy:     %s\n", copy);
    // slide:copy:end
    return EXIT_SUCCESS;
}
