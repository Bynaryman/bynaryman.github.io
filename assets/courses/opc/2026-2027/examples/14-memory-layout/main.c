#include <stdio.h>
// slide:locals:begin
int total = 0;
void visit(void) {
    int values[4] = {10, 20, 30, 40};
    total += values[0];
}
// slide:locals:end
int main(void) {
    visit();
    visit();
    printf("total = %d\n", total);
    return 0;
}
