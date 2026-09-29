#include <stdio.h>
#include <stdlib.h>

typedef struct list_elem {
    int value;
    struct list_elem *next;
} list_elem_t;

int main(void) {
    list_elem_t *head = NULL;
    printf("empty: %d\n", head == NULL);
    return EXIT_SUCCESS;
}
