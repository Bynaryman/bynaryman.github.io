#include "list-support.h"

int main(void) {
    list_elem_t *head = make_abcd();
    if (head == NULL) return EXIT_FAILURE;
    list_elem_t *node = create_element('E');
    if (node == NULL) {
        clear_list(head);
        return EXIT_FAILURE;
    }
    list_elem_t *previous = head->next; /* B */
    puts("before:");
    print_list(head);
    // slide:operation:begin
    node->next = previous->next;
    previous->next = node;
    // slide:operation:end
    puts("after:");
    print_list(head);
    clear_list(head);
    return EXIT_SUCCESS;
}
