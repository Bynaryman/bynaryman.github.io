---
layout: page
title: OPC · C examples
permalink: /courses/opc/examples/
description: C files in lecture order.
nav: false
---

[Course and download]({{ '/courses/opc/' | relative_url }})

Follow **01 → 17**, all in `demos/allocation/`.

```sh
cd demos/allocation
vim 01-fixed-array.c
make run FILE=01-fixed-array.c
```

Files 01–04 develop one working program. Each of 05–08 introduces one fault into 04-free.c. Repair and rerun it before opening the next file.

## Allocate an array

<details id="01-fixed-array" markdown="1" open>
<summary>01-fixed-array.c · Four integers</summary>

```sh
vim 01-fixed-array.c
make run FILE=01-fixed-array.c
```

[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/01-fixed-array.c' | relative_url }})

```c
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int count = 4;
    int p[4];
    for (int i = 0; i < count; ++i)
        p[i] = 0;
    printf("first=%d, last=%d\n", p[0], p[count - 1]);
    return EXIT_SUCCESS;
}
```

</details>

<details id="02-capacity" markdown="1">
<summary>02-capacity.c · Read a count; the array still holds four</summary>

```sh
vim 02-capacity.c
make run FILE=02-capacity.c
```

Enter **100**.

[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/02-capacity.c' | relative_url }})

```c
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int count;
    int p[4];
    if (scanf("%d", &count) != 1) return EXIT_FAILURE;
    if (count <= 0 || count > 4) {
        fputs("Choose 1 to 4: the array has four elements.\n", stderr);
        return EXIT_FAILURE;
    }
    for (int i = 0; i < count; ++i)
        p[i] = 0;
    printf("first=%d, last=%d\n", p[0], p[count - 1]);
    return EXIT_SUCCESS;
}
```

</details>

<details id="03-missing-free" markdown="1">
<summary>03-missing-free.c · Allocate by count; find the missing release</summary>

```sh
vim 03-missing-free.c
make valgrind FILE=03-missing-free.c
```

Enter **100**.

[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/03-missing-free.c' | relative_url }})

```c
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int count;
    if (scanf("%d", &count) != 1) return EXIT_FAILURE;
    if (count <= 0 || count > 1000) return EXIT_FAILURE;
    int *p = malloc(count * sizeof(int));
    if (p == NULL) {
        fputs("Allocation failed\n", stderr);
        return EXIT_FAILURE;
    }
    for (int i = 0; i < count; ++i)
        p[i] = 0;
    printf("first=%d, last=%d\n", p[0], p[count - 1]);
    return EXIT_SUCCESS;
}
```

</details>

<details id="04-free" markdown="1">
<summary>04-free.c · Release after the final read</summary>

```sh
vim 04-free.c
make valgrind FILE=04-free.c
```

Enter **100**.

[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/04-free.c' | relative_url }})

```c
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int count;
    if (scanf("%d", &count) != 1) return EXIT_FAILURE;
    if (count <= 0 || count > 1000) return EXIT_FAILURE;
    int *p = malloc(count * sizeof(int));
    if (p == NULL) {
        fputs("Allocation failed\n", stderr);
        return EXIT_FAILURE;
    }
    for (int i = 0; i < count; ++i)
        p[i] = 0;
    printf("first=%d, last=%d\n", p[0], p[count - 1]);
    free(p);
    return EXIT_SUCCESS;
}
```

</details>

## Memory errors

<details id="05-uninitialised" markdown="1">
<summary>05-uninitialised.c · Remove initialisation; inspect the read</summary>

```sh
vim 05-uninitialised.c
make valgrind FILE=05-uninitialised.c
```

Enter **4**.

[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/05-uninitialised.c' | relative_url }})

```c
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int count;
    if (scanf("%d", &count) != 1) return EXIT_FAILURE;
    if (count <= 0 || count > 1000) return EXIT_FAILURE;
    int *p = malloc(count * sizeof(int));
    if (p == NULL) {
        fputs("Allocation failed\n", stderr);
        return EXIT_FAILURE;
    }
    printf("first=%d, last=%d\n", p[0], p[count - 1]);
    free(p);
    return EXIT_SUCCESS;
}
```

</details>

<details id="06-overrun" markdown="1">
<summary>06-overrun.c · Write one element too far</summary>

```sh
vim 06-overrun.c
make valgrind FILE=06-overrun.c
```

Enter **4**.

[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/06-overrun.c' | relative_url }})

```c
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int count;
    if (scanf("%d", &count) != 1) return EXIT_FAILURE;
    if (count <= 0 || count > 1000) return EXIT_FAILURE;
    int *p = malloc(count * sizeof(int));
    if (p == NULL) {
        fputs("Allocation failed\n", stderr);
        return EXIT_FAILURE;
    }
    for (int i = 0; i <= count; ++i)
        p[i] = 0;
    printf("first=%d, last=%d\n", p[0], p[count - 1]);
    free(p);
    return EXIT_SUCCESS;
}
```

</details>

<details id="07-dangling" markdown="1">
<summary>07-dangling.c · Read after free</summary>

```sh
vim 07-dangling.c
make valgrind FILE=07-dangling.c
```

Enter **4**.

[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/07-dangling.c' | relative_url }})

```c
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int count;
    if (scanf("%d", &count) != 1) return EXIT_FAILURE;
    if (count <= 0 || count > 1000) return EXIT_FAILURE;
    int *p = malloc(count * sizeof(int));
    if (p == NULL) {
        fputs("Allocation failed\n", stderr);
        return EXIT_FAILURE;
    }
    for (int i = 0; i < count; ++i)
        p[i] = 0;
    free(p);
    printf("first=%d, last=%d\n", p[0], p[count - 1]);
    return EXIT_SUCCESS;
}
```

</details>

<details id="08-leak" markdown="1">
<summary>08-leak.c · Lose the address before free</summary>

```sh
vim 08-leak.c
make valgrind FILE=08-leak.c
```

Enter **4**.

[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/08-leak.c' | relative_url }})

```c
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int count;
    if (scanf("%d", &count) != 1) return EXIT_FAILURE;
    if (count <= 0 || count > 1000) return EXIT_FAILURE;
    int *p = malloc(count * sizeof(int));
    if (p == NULL) {
        fputs("Allocation failed\n", stderr);
        return EXIT_FAILURE;
    }
    for (int i = 0; i < count; ++i)
        p[i] = 0;
    printf("first=%d, last=%d\n", p[0], p[count - 1]);
    p = NULL;
    free(p);
    return EXIT_SUCCESS;
}
```

</details>

## Arrays, strings and matrices

<details id="09-array" markdown="1">
<summary>09-array.c · Array elements and their addresses</summary>

```sh
vim 09-array.c
make run FILE=09-array.c
```

[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/09-array.c' | relative_url }})

```c
#include <stdio.h>
#include <stdlib.h>
int main(void) {
    int *a = malloc(4 * sizeof(int));
    if (!a) return EXIT_FAILURE;
    for (int i = 0; i < 4; ++i)
        a[i] = (int)(10 * (i + 1));
    for (int i = 0; i < 4; ++i)
        printf("a[%d]=%d at %p\n", i, a[i], (void *)&a[i]);
    free(a);
    return EXIT_SUCCESS;
}
```

</details>

<details id="10-string" markdown="1">
<summary>10-string.c · Characters and the terminator</summary>

```sh
vim 10-string.c
make run FILE=10-string.c
```

[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/10-string.c' | relative_url }})

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
int main(void) {
    char *s = malloc(4 * sizeof(char));
    if (!s) return EXIT_FAILURE;
    strcpy(s, "cat");  // Three letters and the terminator.
    for (int i = 0; i < 4; ++i)
        printf("s[%d] = %u\n", i, (unsigned char)s[i]);
    puts(s);
    free(s);
    return EXIT_SUCCESS;
}
```

</details>

<details id="11-string-assignment" markdown="1">
<summary>11-string-assignment.c · Pointer assignment is not copying text</summary>

```sh
vim 11-string-assignment.c
make valgrind FILE=11-string-assignment.c
```

[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/11-string-assignment.c' | relative_url }})

```c
#include <stdio.h>
#include <stdlib.h>
int main(void) {
    char *s = malloc(100);
    if (!s) return EXIT_FAILURE;
    // Intentional error from the original string example.
    s = "hello";  // The allocated block is now unreachable.
    char *p = s;
    s = "bye";
    printf("p=%s; s=%s\n", p, s);
    // Neither pointer now points into the allocated block.
    return EXIT_SUCCESS;
}
```

</details>

<details id="12-matrix-flat" markdown="1">
<summary>12-matrix-flat.c · Matrix in one allocation</summary>

```sh
vim 12-matrix-flat.c
make run FILE=12-matrix-flat.c
```

[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/12-matrix-flat.c' | relative_url }})

```c
#include <stdio.h>
#include <stdlib.h>
int main(void) {
    int rows = 4, cols = 3;
    int *m = malloc(rows * cols * sizeof(int));
    if (!m) return EXIT_FAILURE;
    for (int i = 0; i < rows; ++i)
        for (int j = 0; j < cols; ++j)
            m[i * cols + j] = (int)(10 * i + j);
    for (int i = 0; i < rows; ++i) {
        for (int j = 0; j < cols; ++j) printf("%3d", m[i * cols + j]);
        puts("");
    }
    free(m);
    return EXIT_SUCCESS;
}
```

</details>

<details id="13-matrix-rows" markdown="1">
<summary>13-matrix-rows.c · Fixed pointer table; allocated rows</summary>

```sh
vim 13-matrix-rows.c
make run FILE=13-matrix-rows.c
```

[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/13-matrix-rows.c' | relative_url }})

```c
#include <stdio.h>
#include <stdlib.h>
int main(void) {
    int *m[4];
    int i = 0;
    for (; i < 4; ++i) {
        m[i] = malloc(3 * sizeof(int));
        if (!m[i]) break;
    }
    if (i != 4) {
        while (i > 0) free(m[--i]);
        return EXIT_FAILURE;
    }
    for (i = 0; i < 4; ++i) {
        for (int j = 0; j < 3; ++j) {
            m[i][j] = (int)(10 * i + j);
            printf("%3d", m[i][j]);
        }
        puts("");
    }
    for (i = 0; i < 4; ++i) free(m[i]);
    return EXIT_SUCCESS;
}
```

</details>

<details id="14-matrix-dynamic" markdown="1">
<summary>14-matrix-dynamic.c · Allocated pointer table and rows</summary>

```sh
vim 14-matrix-dynamic.c
make run FILE=14-matrix-dynamic.c
```

[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/14-matrix-dynamic.c' | relative_url }})

```c
#include <stdio.h>
#include <stdlib.h>
int main(void) {
    int rows = 4, cols = 3;
    int **m = malloc(rows * sizeof(int *));
    if (!m) return EXIT_FAILURE;
    int i = 0;
    for (; i < rows; ++i) {
        m[i] = malloc(cols * sizeof(int));
        if (!m[i]) break;
    }
    if (i != rows) {
        while (i > 0) free(m[--i]);
        free(m);
        return EXIT_FAILURE;
    }
    for (i = 0; i < rows; ++i) {
        for (int j = 0; j < cols; ++j) {
            m[i][j] = (int)(10 * i + j);
            printf("%3d", m[i][j]);
        }
        puts("");
    }
    for (i = 0; i < rows; ++i) free(m[i]);
    free(m);
    return EXIT_SUCCESS;
}
```

</details>

## User-defined types

<details id="15-types" markdown="1">
<summary>15-types.c · Enumerations and structure members</summary>

```sh
vim 15-types.c
make run FILE=15-types.c
```

[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/15-types.c' | relative_url }})

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

enum day { mon, tue, wed, thu, fri, sat, sun };
struct address {
    char street[100];
    int number;
};

int main(void) {
    enum day today;
    today = wed;
    printf("mon=%d, today=%d, sun=%d\n", mon, today, sun);
    struct address home = { "Paul Bert", 12 };
    printf("initial: %d %s\n", home.number, home.street);
    strcpy(home.street, "Rue de Paris");
    home.number = 14;
    printf("dot:     %d %s\n", home.number, home.street);
    struct address *p = &home;
    strcpy(p->street, "Rue de Paris");
    p->number = 16;
    printf("arrow:   %d %s\n", home.number, home.street);
    return EXIT_SUCCESS;
}
```

</details>

<details id="16-padding" markdown="1">
<summary>16-padding.c · Measure structure sizes and offsets</summary>

```sh
vim 16-padding.c
make run FILE=16-padding.c
```

[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/16-padding.c' | relative_url }})

```c
#include <stdio.h>
#include <stdlib.h>
#include <stddef.h>
struct grouped {
    int id1, id2;
    char c1, c2;
    float ratio;
};
struct interleaved {
    int id1; char c1;
    int id2; char c2;
    float ratio;
};
int main(void) {
    // These small sizes fit in int; convert explicitly for printf("%d").
    printf("int=%d float=%d\n", (int)sizeof(int), (int)sizeof(float));
    printf("grouped: %d bytes; ratio at %d\n", (int)sizeof(struct grouped), (int)offsetof(struct grouped, ratio));
    printf("mixed:   %d bytes; ratio at %d\n", (int)sizeof(struct interleaved), (int)offsetof(struct interleaved, ratio));
    return EXIT_SUCCESS;
}
```

</details>

<details id="17-nested" markdown="1">
<summary>17-nested.c · Nested structures</summary>

```sh
vim 17-nested.c
make run FILE=17-nested.c
```

[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/17-nested.c' | relative_url }})

```c
#include <stdio.h>
#include <stdlib.h>
struct date { short day, month; int year; };
typedef enum { mon, tue, wed, thu, fri, sat, sun } DAY;
typedef struct { DAY day; struct date date; } A_DATE;
int main(void) {
    A_DATE today = { wed, { 3, 9, 2014 } };
    today.day = wed;
    today.date.year = 2014;
    A_DATE *p = &today;
    p->day = today.day;
    p->date.year = 2026;
    printf("day code=%d; %d/%d/%d\n", today.day, today.date.day, today.date.month, today.date.year);
    return EXIT_SUCCESS;
}
```

</details>
