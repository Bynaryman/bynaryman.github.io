#include<stdio.h>

/* Read an integer i, then %-separated parts; print part i (numbered from 1). */

int	main(void) {
  int	c;
  int	icherche,icour;

  if (scanf("%d",&icherche) != 1 || icherche < 1) return 1;
  icour=1;
  c = getchar();

  while((c != EOF) && (icour<=icherche)) {

    if (c=='%')
      icour ++;
    else if (icour==icherche)
      putchar(c);

    c = getchar();
  }
  printf("\n");
  return 0;
}
