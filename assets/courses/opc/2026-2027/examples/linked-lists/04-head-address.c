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

// slide:insert:begin
int insert_head(list_elem_t **l, int value) {
    list_elem_t *node = create_element(value);
    if (node == NULL) return -1;
    node->next = *l;
    *l = node;
    return 0;
}
// slide:insert:end

int main(void) {
    list_elem_t *head = NULL;
    if (insert_head(&head, 'A') != 0) return EXIT_FAILURE;
    printf("head -> %c -> NULL\n", head->value);
    free(head);
    return EXIT_SUCCESS;
}
