#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// slide:enum:begin
enum day { mon, tue, wed, thu, fri, sat, sun };
// slide:enum:end
// slide:struct:begin
struct address {
    char street[100];
    int number;
};
// slide:struct:end

int main(void) {
    enum day today;
    today = wed;
    printf("mon=%d, today=%d, sun=%d\n", mon, today, sun);
    // slide:init:begin
    struct address home = { "Paul Bert", 12 };
    // slide:init:end
    printf("initial: %d %s\n", home.number, home.street);
    // slide:dot:begin
    strcpy(home.street, "Rue de Paris");
    home.number = 14;
    // slide:dot:end
    printf("dot:     %d %s\n", home.number, home.street);
    // slide:arrow:begin
    struct address *p = &home;
    strcpy(p->street, "Rue de Paris");
    p->number = 16;
    // slide:arrow:end
    printf("arrow:   %d %s\n", home.number, home.street);
    return EXIT_SUCCESS;
}
