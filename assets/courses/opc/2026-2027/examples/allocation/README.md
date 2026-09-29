# Allocation lecture: file order

Stay in this folder. **01 → 18** are stable reference filenames. The guide sets the teaching order.
Files 11 and 12 are optional references, outside the slide sequence.
Each is a complete program; running every file is not the teaching sequence.
Follow the printed guide and [runbook](../../docs/allocation-runbook.md): ask,
predict, run, then reveal. Some slides only explain the previous result.

```sh
cd demos/allocation
cp -n 01-copy-alias.c live-copy.c
cp -n 05-integers.c live-integers.c
cp -n types-start.c live-types.c
vim live-copy.c
```

Save in Vim with `:w`. Run `make run FILE=live-copy.c` only after the first
predictions on slide 7. Later use `make valgrind FILE=live-copy.c`.
The `-n` option preserves existing files; inspect rehearsed copies before class.

Files **01–04** develop the same string-copy program. No input is needed.
The only change from 02 to 03 is `+ 1`; from 03 to 04 it is `free(copy)`.
File **05** applies allocation to integers. Files **06–09** each introduce one
independent fault into **05-integers.c**. Repair and rerun each before moving on.

You can also edit your own scratchpad: `make run FILE=scatchpad.c`, then
`make valgrind FILE=scatchpad.c`. The direct compiler command is:

```sh
gcc -std=c17 -Wall -Wextra -Wpedantic -Werror=vla -O0 -g scatchpad.c -o scatchpad
```

This course uses fixed-size arrays and malloc. The Makefile's `-Werror=vla`
excludes variable-length arrays as a teaching choice; it is not a C language rule.

For structures, build `live-types.c` incrementally from [types-start.c](types-start.c).
**16-types.c** is the completed reference; do not run it at the section opening.
**11-string.c** is an optional reference outside the slide sequence. The commands below run saved references;
use your working filename when checking live edits.

The teacher’s guide prints the exact `cp` command for each step. Intermediate
states live in `recovery/`; use these only when the guide names them. After an
external copy, reload the Vim buffer with `:e!` before running or editing.

## Copy a string

| File | Investigation | Run |
| --- | --- | --- |
| [01-copy-alias.c](01-copy-alias.c) | Change the copy; the original changes too. | `make run FILE=01-copy-alias.c` |
| [02-copy-short.c](02-copy-short.c) | Allocate and copy; inspect the invalid write. | `make valgrind FILE=02-copy-short.c` |
| [03-copy-leak.c](03-copy-leak.c) | Add room for the terminator; inspect the leak. | `make valgrind FILE=03-copy-leak.c` |
| [04-copy-free.c](04-copy-free.c) | Release the copy after printing. | `make valgrind FILE=04-copy-free.c` |
## Arrays and memory errors

| File | Investigation | Run |
| --- | --- | --- |
| [05-integers.c](05-integers.c) | Allocate and initialise a requested number of integers. Enter **100**. | `make valgrind FILE=05-integers.c` |
| [06-uninitialised.c](06-uninitialised.c) | Remove initialisation; inspect the read. Enter **4**. | `make valgrind FILE=06-uninitialised.c` |
| [07-overrun.c](07-overrun.c) | Write one element too far. Enter **4**. | `make valgrind FILE=07-overrun.c` |
| [08-dangling.c](08-dangling.c) | Read after free. Enter **4**. | `make valgrind FILE=08-dangling.c` |
| [09-leak.c](09-leak.c) | Lose the address before free. Enter **4**. | `make valgrind FILE=09-leak.c` |
## One row, then a grid

| File | Investigation | Run |
| --- | --- | --- |
| [10-array.c](10-array.c) | Array elements and their addresses. | `make run FILE=10-array.c` |
| [13-matrix-flat.c](13-matrix-flat.c) | Matrix in one allocation. | `make run FILE=13-matrix-flat.c` |
| [14-matrix-rows.c](14-matrix-rows.c) | Fixed pointer table; allocated rows. | `make run FILE=14-matrix-rows.c` |
| [15-matrix-dynamic.c](15-matrix-dynamic.c) | Allocated pointer table and rows. | `make run FILE=15-matrix-dynamic.c` |
Optional references: [11-string.c](11-string.c) shows characters and the terminator;
[12-string-assignment.c](12-string-assignment.c) traces pointer assignments.
Neither adds a step to the lecture.

## User-defined types

| File | Investigation | Run |
| --- | --- | --- |
| [16-types.c](16-types.c) | Enumerations and structure members. | `make run FILE=16-types.c` |
| [17-padding.c](17-padding.c) | Measure structure sizes and offsets. | `make run FILE=17-padding.c` |
| [18-nested.c](18-nested.c) | Nested structures. | `make run FILE=18-nested.c` |

See [the teaching notes](../../docs/allocation-runbook.md) for the observations and repairs.
