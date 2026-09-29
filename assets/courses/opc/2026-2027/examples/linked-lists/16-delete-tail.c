#include "list-support.h"

int main(void) {
    list_elem_t *head = make_abcd();
    if (head == NULL) return EXIT_FAILURE;
    list_elem_t *previous = head;
    while (previous->next->next != NULL) previous = previous->next;
    puts("before:");
    print_list(head);
    // slide:operation:begin
    list_elem_t *victim = previous->next;
    previous->next = NULL;
    free(victim);
    // slide:operation:end
    puts("after:");
    print_list(head);
    clear_list(head);
    return EXIT_SUCCESS;
}
