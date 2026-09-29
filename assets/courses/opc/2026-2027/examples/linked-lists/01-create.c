#include <stdio.h>
#include <stdlib.h>

typedef struct list_elem {
    int value;
    struct list_elem *next;
} list_elem_t;

// slide:create:begin
list_elem_t *create_element(int value) {
    list_elem_t *node = malloc(sizeof(list_elem_t));
    if (node == NULL) return NULL;
    node->value = value;
    node->next = NULL;
    return node;
}
// slide:create:end

int main(void) {
    list_elem_t *head = NULL;
    list_elem_t *node = create_element('A');
    if (node == NULL) return EXIT_FAILURE;
    printf("head empty: %d, node value: %c\n", head == NULL, node->value);
    free(node);
    return EXIT_SUCCESS;
}
