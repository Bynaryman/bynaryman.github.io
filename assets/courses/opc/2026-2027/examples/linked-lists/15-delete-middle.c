#include "list-support.h"

int main(void) {
    list_elem_t *head = make_abcd();
    if (head == NULL) return EXIT_FAILURE;
    list_elem_t *previous = head; /* A, before B */
    puts("before:");
    print_list(head);
    // slide:operation:begin
    list_elem_t *victim = previous->next;
    previous->next = victim->next;
    free(victim);
    // slide:operation:end
    puts("after:");
    print_list(head);
    clear_list(head);
    return EXIT_SUCCESS;
}
