#include "list-support.h"

int main(void) {
    list_elem_t *head = make_abcd();
    if (head == NULL) return EXIT_FAILURE;
    list_elem_t *node = create_element('E');
    if (node == NULL) {
        clear_list(head);
        return EXIT_FAILURE;
    }
    puts("before:");
    print_list(head);
    // slide:operation:begin
    /* Add the two insertion statements here. */
    // slide:operation:end
    puts("after:");
    print_list(head);
    free(node); /* Remove this line when node belongs to the list. */
    clear_list(head);
    return EXIT_SUCCESS;
}
