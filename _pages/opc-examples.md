---
layout: page
title: OPC · C examples
permalink: /courses/opc/examples/
description: Source files for the dynamic memory lecture.
nav: false
---

[Course and download]({{ '/courses/opc/' | relative_url }})

Start with `demos/00-allocation/main.c`. The saved steps below develop the same program.

## Allocation and memory errors

<details id="00-allocation-01-array" markdown="1" open>
<summary>Four integers</summary>

`demos/00-allocation/main.c`

[Download C]({{ '/assets/courses/opc/2026-2027/examples/00-allocation/main.c' | relative_url }})

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

<details id="00-allocation-02-capacity" markdown="1">
<summary>Read the count</summary>

`demos/00-allocation/checkpoints/02-capacity.c`

[Download C]({{ '/assets/courses/opc/2026-2027/examples/00-allocation/checkpoints/02-capacity.c' | relative_url }})

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

<details id="00-allocation-03-missing-free" markdown="1">
<summary>Allocated, but not released</summary>

`demos/00-allocation/checkpoints/03-missing-free.c`

[Download C]({{ '/assets/courses/opc/2026-2027/examples/00-allocation/checkpoints/03-missing-free.c' | relative_url }})

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

<details id="00-allocation-03-heap" markdown="1">
<summary>Repair: release after use</summary>

`demos/00-allocation/checkpoints/03-heap.c`

[Download C]({{ '/assets/courses/opc/2026-2027/examples/00-allocation/checkpoints/03-heap.c' | relative_url }})

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

<details id="00-allocation-05-uninitialised" markdown="1">
<summary>Skip initialisation</summary>

`demos/00-allocation/checkpoints/05-uninitialised.c`

[Download C]({{ '/assets/courses/opc/2026-2027/examples/00-allocation/checkpoints/05-uninitialised.c' | relative_url }})

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

<details id="00-allocation-04-overrun" markdown="1">
<summary>One extra iteration</summary>

`demos/00-allocation/checkpoints/04-overrun.c`

[Download C]({{ '/assets/courses/opc/2026-2027/examples/00-allocation/checkpoints/04-overrun.c' | relative_url }})

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

<details id="00-allocation-07-dangling" markdown="1">
<summary>Free before reading</summary>

`demos/00-allocation/checkpoints/07-dangling.c`

[Download C]({{ '/assets/courses/opc/2026-2027/examples/00-allocation/checkpoints/07-dangling.c' | relative_url }})

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

<details id="00-allocation-06-leak" markdown="1">
<summary>Lose the address</summary>

`demos/00-allocation/checkpoints/06-leak.c`

[Download C]({{ '/assets/courses/opc/2026-2027/examples/00-allocation/checkpoints/06-leak.c' | relative_url }})

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

## Other examples

<details id="01-malloc-main" markdown="1">
<summary>100 integers</summary>

`demos/01-malloc/main.c`

[Download C]({{ '/assets/courses/opc/2026-2027/examples/01-malloc/main.c' | relative_url }})

```c
#include <stdio.h>
#include <stdlib.h>
int main(void) {
    int count = 100;
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

<details id="03-leak-main" markdown="1">
<summary>Pointer assignment and strings</summary>

`demos/03-leak/main.c`

[Download C]({{ '/assets/courses/opc/2026-2027/examples/03-leak/main.c' | relative_url }})

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

<details id="04-array-main" markdown="1">
<summary>Array elements and addresses</summary>

`demos/04-array/main.c`

[Download C]({{ '/assets/courses/opc/2026-2027/examples/04-array/main.c' | relative_url }})

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

<details id="05-string-main" markdown="1">
<summary>A string and its terminator</summary>

`demos/05-string/main.c`

[Download C]({{ '/assets/courses/opc/2026-2027/examples/05-string/main.c' | relative_url }})

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

<details id="06-matrix-flat-main" markdown="1">
<summary>Matrix in one block</summary>

`demos/06-matrix-flat/main.c`

[Download C]({{ '/assets/courses/opc/2026-2027/examples/06-matrix-flat/main.c' | relative_url }})

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

<details id="07-matrix-rows-main" markdown="1">
<summary>Matrix with a fixed row-pointer table</summary>

`demos/07-matrix-rows/main.c`

[Download C]({{ '/assets/courses/opc/2026-2027/examples/07-matrix-rows/main.c' | relative_url }})

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

<details id="08-matrix-dynamic-main" markdown="1">
<summary>Matrix with an allocated row-pointer table</summary>

`demos/08-matrix-dynamic/main.c`

[Download C]({{ '/assets/courses/opc/2026-2027/examples/08-matrix-dynamic/main.c' | relative_url }})

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

<details id="09-struct-padding-main" markdown="1">
<summary>Structure padding</summary>

`demos/09-struct-padding/main.c`

[Download C]({{ '/assets/courses/opc/2026-2027/examples/09-struct-padding/main.c' | relative_url }})

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

<details id="10-nested-struct-main" markdown="1">
<summary>Nested structures</summary>

`demos/10-nested-struct/main.c`

[Download C]({{ '/assets/courses/opc/2026-2027/examples/10-nested-struct/main.c' | relative_url }})

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

<details id="14-memory-layout-main" markdown="1">
<summary>Static and automatic storage</summary>

`demos/14-memory-layout/main.c`

[Download C]({{ '/assets/courses/opc/2026-2027/examples/14-memory-layout/main.c' | relative_url }})

```c
#include <stdio.h>
int total = 0;
void visit(void) {
    int values[4] = {10, 20, 30, 40};
    total += values[0];
}
int main(void) {
    visit();
    visit();
    printf("total = %d\n", total);
    return 0;
}
```

</details>

<details id="19-types-main" markdown="1">
<summary>Enumerations and structure members</summary>

`demos/19-types/main.c`

[Download C]({{ '/assets/courses/opc/2026-2027/examples/19-types/main.c' | relative_url }})

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
