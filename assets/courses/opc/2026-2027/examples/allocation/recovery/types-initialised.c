#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* Add type definitions above main. */
enum day { mon, tue, wed, thu, fri, sat, sun };

struct address {
    char street[100];
    int number;
};

int main(void) {
    /* Add declarations and statements before return. */
    enum day today;
    today = wed;
    printf("today=%d\n", today);
    struct address home = { "Paul Bert", 12 };
    printf("%d %s\n", home.number, home.street);
    return EXIT_SUCCESS;
}
