---
layout: page
title: OPC · C examples
permalink: /courses/opc/examples/
description: C files in lecture order.
nav: false
---

[Course and download]({{ '/courses/opc/' | relative_url }})

References **01 → 18**, all in `demos/allocation/`. Follow the lecture runbook for when to run.

```sh
cd demos/allocation
vim 01-copy-alias.c
make run FILE=01-copy-alias.c
```

Files 01–04 develop a string copy: shared storage, a missing byte, a leak, then the repair. Files 11 and 12 are optional references, outside the slide sequence. File 05 introduces integers; each of 06–09 introduces one fault into 05-integers.c. Repair and rerun each.

[Structure starter]({{ '/assets/courses/opc/2026-2027/examples/allocation/types-start.c' | relative_url }}) · copy to `live-types.c` for incremental coding.

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

## One row, then a grid

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

## Optional reference

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

## Linked lists {#linked-lists}

Use the checkpoints named in the lecture. Work in `demos/linked-lists/`:

```sh
cp -n 00-empty.c live-list.c
vim live-list.c
make run
make valgrind
```

Files 03, 06 and 09 deliberately leak; compare them with the following repair.

[Shared helper]({{ '/assets/courses/opc/2026-2027/examples/linked-lists/list-support.h' | relative_url }}) · [Makefile]({{ '/assets/courses/opc/2026-2027/examples/linked-lists/Makefile' | relative_url }})

<!-- prettier-ignore -->
| Checkpoint | Expected output |
|---|---|
| [intro/01-one-node.c]({{ '/assets/courses/opc/2026-2027/examples/linked-lists/intro/01-one-node.c' | relative_url }}) | `A -> NULL` |
| [intro/02-two-nodes.c]({{ '/assets/courses/opc/2026-2027/examples/linked-lists/intro/02-two-nodes.c' | relative_url }}) | `A -> B -> NULL` |
| [intro/03-walk.c]({{ '/assets/courses/opc/2026-2027/examples/linked-lists/intro/03-walk.c' | relative_url }}) | `A -> B -> NULL` |
| [00-empty.c]({{ '/assets/courses/opc/2026-2027/examples/linked-lists/00-empty.c' | relative_url }}) | `empty: 1` |
| [01-create.c]({{ '/assets/courses/opc/2026-2027/examples/linked-lists/01-create.c' | relative_url }}) | `head empty: 1, node value: A` |
| [02-first-node.c]({{ '/assets/courses/opc/2026-2027/examples/linked-lists/02-first-node.c' | relative_url }}) | `head -> A -> NULL` |
| [03-head-copy.c]({{ '/assets/courses/opc/2026-2027/examples/linked-lists/03-head-copy.c' | relative_url }}) | `caller head empty: 1` |
| [04-head-address.c]({{ '/assets/courses/opc/2026-2027/examples/linked-lists/04-head-address.c' | relative_url }}) | `head -> A -> NULL` |
| [05-head-before.c]({{ '/assets/courses/opc/2026-2027/examples/linked-lists/05-head-before.c' | relative_url }}) | `before: / A -> B -> C -> D -> NULL / after: / A -> B -> C -> D -> NULL` |
| [06-head-lost.c]({{ '/assets/courses/opc/2026-2027/examples/linked-lists/06-head-lost.c' | relative_url }}) | `before: / A -> B -> C -> D -> NULL / after: / E -> NULL` |
| [07-head-fixed.c]({{ '/assets/courses/opc/2026-2027/examples/linked-lists/07-head-fixed.c' | relative_url }}) | `before: / A -> B -> C -> D -> NULL / after: / E -> A -> B -> C -> D -> NULL` |
| [08-middle-before.c]({{ '/assets/courses/opc/2026-2027/examples/linked-lists/08-middle-before.c' | relative_url }}) | `before: / A -> B -> C -> D -> NULL / after: / A -> B -> C -> D -> NULL` |
| [09-middle-lost.c]({{ '/assets/courses/opc/2026-2027/examples/linked-lists/09-middle-lost.c' | relative_url }}) | `before: / A -> B -> C -> D -> NULL / after: / A -> B -> E -> NULL` |
| [10-middle-fixed.c]({{ '/assets/courses/opc/2026-2027/examples/linked-lists/10-middle-fixed.c' | relative_url }}) | `before: / A -> B -> C -> D -> NULL / after: / A -> B -> E -> C -> D -> NULL` |
| [11-tail-before.c]({{ '/assets/courses/opc/2026-2027/examples/linked-lists/11-tail-before.c' | relative_url }}) | `before: / A -> B -> C -> D -> NULL / after: / A -> B -> C -> D -> NULL` |
| [12-tail-fixed.c]({{ '/assets/courses/opc/2026-2027/examples/linked-lists/12-tail-fixed.c' | relative_url }}) | `before: / A -> B -> C -> D -> NULL / after: / A -> B -> C -> D -> E -> NULL` |
| [13-delete-before.c]({{ '/assets/courses/opc/2026-2027/examples/linked-lists/13-delete-before.c' | relative_url }}) | `before: / A -> B -> C -> D -> NULL / after: / A -> B -> C -> D -> NULL` |
| [14-delete-head.c]({{ '/assets/courses/opc/2026-2027/examples/linked-lists/14-delete-head.c' | relative_url }}) | `before: / A -> B -> C -> D -> NULL / after: / B -> C -> D -> NULL` |
| [15-delete-middle.c]({{ '/assets/courses/opc/2026-2027/examples/linked-lists/15-delete-middle.c' | relative_url }}) | `before: / A -> B -> C -> D -> NULL / after: / A -> C -> D -> NULL` |
| [16-delete-tail.c]({{ '/assets/courses/opc/2026-2027/examples/linked-lists/16-delete-tail.c' | relative_url }}) | `before: / A -> B -> C -> D -> NULL / after: / A -> B -> C -> NULL` |
