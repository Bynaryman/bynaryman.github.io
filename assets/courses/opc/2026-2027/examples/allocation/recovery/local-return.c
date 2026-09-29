#include <stdlib.h>

/* Deliberately wrong: the ordinary local array expires on return. */
int *make_values(void) {
    int values[4] = {0};
    return values;
}

int main(void) {
    /* Inspect/compile the function; do not dereference its invalid result. */
    return EXIT_SUCCESS;
}
