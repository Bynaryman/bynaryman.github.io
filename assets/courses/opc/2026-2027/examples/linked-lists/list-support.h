#ifndef OPC_LIST_SUPPORT_H
#define OPC_LIST_SUPPORT_H
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

/* Helpers for the operation demos: inspect these once, then edit main. */
void print_list(const list_elem_t *head) {
    const list_elem_t *p = head;
    while (p != NULL) {
        printf("%c -> ", p->value);
        p = p->next;
    }
    puts("NULL");
}

void clear_list(list_elem_t *head) {
    while (head != NULL) {
        list_elem_t *next = head->next;
        free(head);
        head = next;
    }
}

list_elem_t *make_abcd(void) {
    list_elem_t *head = NULL;
    /* Prepend D, C, B, A to obtain A -> B -> C -> D. */
    for (int value = 'D'; value >= 'A'; --value) {
        list_elem_t *node = create_element(value);
        if (node == NULL) {
            clear_list(head);
            return NULL;
        }
        node->next = head;
        head = node;
    }
    return head;
}

#endif
