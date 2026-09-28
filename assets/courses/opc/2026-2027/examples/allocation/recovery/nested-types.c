#include <stdio.h>
#include <stdlib.h>
// slide:types:begin
struct date { short day, month; int year; };
typedef enum { mon, tue, wed, thu, fri, sat, sun } DAY;
typedef struct { DAY day; struct date date; } A_DATE;
// slide:types:end
int main(void) {
    /* Define the types first; object and updates come on the next slide. */
    return EXIT_SUCCESS;
}
