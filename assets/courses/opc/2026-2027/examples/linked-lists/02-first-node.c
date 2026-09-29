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
    // slide:operation:begin
    head = node;
    // slide:operation:end
    printf("head -> %c -> NULL\n", head->value);
    free(head);
    return EXIT_SUCCESS;
}
