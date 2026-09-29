#include <stdio.h>
#include <stdlib.h>

typedef struct list_elem {
    int value;
    struct list_elem *next;
} list_elem_t;

int main(void) {
    list_elem_t *head = NULL;
    // slide:first:begin
    list_elem_t *node = malloc(sizeof(list_elem_t));
    if (node == NULL) return EXIT_FAILURE;
    node->value = 'A';
    node->next = NULL;
    head = node;
    // slide:first:end
    // slide:second:begin
    node = malloc(sizeof(list_elem_t));
    if (node == NULL) {
        free(head);
        return EXIT_FAILURE;
    }
    node->value = 'B';
    node->next = NULL;
    head->next = node;
    // slide:second:end
    // slide:walk:begin
    list_elem_t *p = head;
    while (p != NULL) {
        printf("%c -> ", p->value);
        p = p->next;
    }
    puts("NULL");
    // slide:walk:end
    free(head->next);
    free(head);
    return EXIT_SUCCESS;
}
