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
    // These small sizes fit in int; convert explicitly for printf("%d").
    printf("int=%d float=%d\n", (int)sizeof(int), (int)sizeof(float));
    printf("grouped: %d bytes; ratio at %d\n", (int)sizeof(struct grouped), (int)offsetof(struct grouped, ratio));
    printf("mixed:   %d bytes; ratio at %d\n", (int)sizeof(struct interleaved), (int)offsetof(struct interleaved, ratio));
    return EXIT_SUCCESS;
}
