#include <stdio.h>
#include <stdlib.h>
#include <stddef.h>
// slide:types:begin
struct grouped {
    int id1, id2;
    char c1, c2;
    float ratio;
};
struct interleaved {
    int id1; char c1;
    int id2; char c2;
    float ratio;
};
// slide:types:end
int main(void) {
    printf("int=%zu float=%zu\n", sizeof(int), sizeof(float));
    printf("grouped: %zu bytes; ratio at %zu\n", sizeof(struct grouped), offsetof(struct grouped, ratio));
    printf("mixed:   %zu bytes; ratio at %zu\n", sizeof(struct interleaved), offsetof(struct interleaved, ratio));
    return EXIT_SUCCESS;
}
