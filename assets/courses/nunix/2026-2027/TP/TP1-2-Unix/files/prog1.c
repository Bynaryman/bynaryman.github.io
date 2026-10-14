#include <stdio.h>

/* Read standard input until %, doubling each character on standard output. */

int main(void) {
  int c;
  do {
    c = getchar();
    if (c == EOF) break;
    putchar(c);
    putchar(c);
  } while(c!='%');
  return 0;
}
