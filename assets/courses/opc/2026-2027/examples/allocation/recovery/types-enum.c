#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* Add type definitions above main. */
enum day { mon, tue, wed, thu, fri, sat, sun };

int main(void) {
    /* Add declarations and statements before return. */
    enum day today;
    today = wed;
    printf("today=%d\n", today);
    return EXIT_SUCCESS;
}
