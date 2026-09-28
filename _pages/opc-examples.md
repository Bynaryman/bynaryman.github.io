---
layout: page
title: OPC · C examples
permalink: /courses/opc/examples/
description: C files in lecture order.
nav: false
---

[Course and download]({{ '/courses/opc/' | relative_url }})

Follow **01 → 18**, all in `demos/allocation/`.

```sh
cd demos/allocation
vim 01-copy-alias.c
make run FILE=01-copy-alias.c
```

Files 01–04 develop a string copy: shared storage, a missing byte, a leak, then the repair. File 05 introduces integers; each of 06–09 introduces one fault into 05-integers.c. Repair and rerun each.

## Copy a string

<details id="01-copy-alias" markdown="1" open>
<summary>01-copy-alias.c · Change the copy; the original changes too</summary>

```sh
vim 01-copy-alias.c
make run FILE=01-copy-alias.c
```

[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/01-copy-alias.c' | relative_url }})

```c
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    char original[] = "hello";
    char *copy = original;

    copy[0] = 'H';
    printf("original: %s\n", original);
    printf("copy:     %s\n", copy);
    return EXIT_SUCCESS;
}
```

</details>

<details id="02-copy-short" markdown="1">
<summary>02-copy-short.c · Allocate and copy; inspect the invalid write</summary>

```sh
vim 02-copy-short.c
make valgrind FILE=02-copy-short.c
```

[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/02-copy-short.c' | relative_url }})

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
    char original[] = "hello";
    char *copy = malloc(strlen(original));
    if (copy == NULL)
        return EXIT_FAILURE;

    strcpy(copy, original);
    copy[0] = 'H';
    printf("original: %s\n", original);
    printf("copy:     %s\n", copy);
    return EXIT_SUCCESS;
}
```

</details>

<details id="03-copy-leak" markdown="1">
<summary>03-copy-leak.c · Add room for the terminator; inspect the leak</summary>

```sh
vim 03-copy-leak.c
make valgrind FILE=03-copy-leak.c
```

[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/03-copy-leak.c' | relative_url }})

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
    char original[] = "hello";
    char *copy = malloc(strlen(original) + 1);
    if (copy == NULL)
        return EXIT_FAILURE;

    strcpy(copy, original);
    copy[0] = 'H';
    printf("original: %s\n", original);
    printf("copy:     %s\n", copy);
    return EXIT_SUCCESS;
}
```

</details>

<details id="04-copy-free" markdown="1">
<summary>04-copy-free.c · Release the copy after printing</summary>

```sh
vim 04-copy-free.c
make valgrind FILE=04-copy-free.c
```

[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/04-copy-free.c' | relative_url }})

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
    char original[] = "hello";
    char *copy = malloc(strlen(original) + 1);
    if (copy == NULL)
        return EXIT_FAILURE;

    strcpy(copy, original);
    copy[0] = 'H';
    printf("original: %s\n", original);
    printf("copy:     %s\n", copy);
    free(copy);
    return EXIT_SUCCESS;
}
```

</details>

## Arrays and memory errors

<details id="05-integers" markdown="1">
<summary>05-integers.c · Allocate and initialise a requested number of integers</summary>

```sh
vim 05-integers.c
make valgrind FILE=05-integers.c
```

Enter **100**.

[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/05-integers.c' | relative_url }})

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

<details id="06-uninitialised" markdown="1">
<summary>06-uninitialised.c · Remove initialisation; inspect the read</summary>

```sh
vim 06-uninitialised.c
make valgrind FILE=06-uninitialised.c
```

Enter **4**.

[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/06-uninitialised.c' | relative_url }})

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

<details id="07-overrun" markdown="1">
<summary>07-overrun.c · Write one element too far</summary>

```sh
vim 07-overrun.c
make valgrind FILE=07-overrun.c
```

Enter **4**.

[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/07-overrun.c' | relative_url }})

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

<details id="08-dangling" markdown="1">
<summary>08-dangling.c · Read after free</summary>

```sh
vim 08-dangling.c
make valgrind FILE=08-dangling.c
```

Enter **4**.

[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/08-dangling.c' | relative_url }})

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

<details id="09-leak" markdown="1">
<summary>09-leak.c · Lose the address before free</summary>

```sh
vim 09-leak.c
make valgrind FILE=09-leak.c
```

Enter **4**.

[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/09-leak.c' | relative_url }})

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

<details id="10-array" markdown="1">
<summary>10-array.c · Array elements and their addresses</summary>

```sh
vim 10-array.c
make run FILE=10-array.c
```

[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/10-array.c' | relative_url }})

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

<details id="11-string" markdown="1">
<summary>11-string.c · Characters and the terminator</summary>

```sh
vim 11-string.c
make run FILE=11-string.c
```

[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/11-string.c' | relative_url }})

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

<details id="12-string-assignment" markdown="1">
<summary>12-string-assignment.c · Pointer assignment is not copying text</summary>

```sh
vim 12-string-assignment.c
make valgrind FILE=12-string-assignment.c
```

[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/12-string-assignment.c' | relative_url }})

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

<details id="13-matrix-flat" markdown="1">
<summary>13-matrix-flat.c · Matrix in one allocation</summary>

```sh
vim 13-matrix-flat.c
make run FILE=13-matrix-flat.c
```

[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/13-matrix-flat.c' | relative_url }})

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

<details id="14-matrix-rows" markdown="1">
<summary>14-matrix-rows.c · Fixed pointer table; allocated rows</summary>

```sh
vim 14-matrix-rows.c
make run FILE=14-matrix-rows.c
```

[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/14-matrix-rows.c' | relative_url }})

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

<details id="15-matrix-dynamic" markdown="1">
<summary>15-matrix-dynamic.c · Allocated pointer table and rows</summary>

```sh
vim 15-matrix-dynamic.c
make run FILE=15-matrix-dynamic.c
```

[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/15-matrix-dynamic.c' | relative_url }})

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

<details id="16-types" markdown="1">
<summary>16-types.c · Enumerations and structure members</summary>

```sh
vim 16-types.c
make run FILE=16-types.c
```

[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/16-types.c' | relative_url }})

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

<details id="17-padding" markdown="1">
<summary>17-padding.c · Measure structure sizes and offsets</summary>

```sh
vim 17-padding.c
make run FILE=17-padding.c
```

[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/17-padding.c' | relative_url }})

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

<details id="18-nested" markdown="1">
<summary>18-nested.c · Nested structures</summary>

```sh
vim 18-nested.c
make run FILE=18-nested.c
```

[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/18-nested.c' | relative_url }})

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
