#include <stdio.h>
#include <stdlib.h>
// slide:types:begin
struct date { short day, month; int year; };
typedef enum { mon, tue, wed, thu, fri, sat, sun } DAY;
typedef struct { DAY day; struct date date; } A_DATE;
// slide:types:end
int main(void) {
    // slide:access:begin
    A_DATE today = { wed, { 3, 9, 2014 } };
    today.day = wed;
    today.date.year = 2014;
    A_DATE *p = &today;
    p->day = today.day;
    p->date.year = 2026;
    // slide:access:end
    printf("day code=%d; %d/%d/%d\n", today.day, today.date.day, today.date.month, today.date.year);
    return EXIT_SUCCESS;
}
