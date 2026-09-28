#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
    char original[] = "hello";
    // slide:allocation:begin
    char *copy = malloc(strlen(original) + 1);
    if (copy == NULL)
        return EXIT_FAILURE;
    // slide:allocation:end

    // slide:copy:begin
    strcpy(copy, original);
    copy[0] = 'H';
    printf("original: %s\n", original);
    printf("copy:     %s\n", copy);
    // slide:copy:end
    free(copy);
    return EXIT_SUCCESS;
}
