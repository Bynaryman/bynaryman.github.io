# Linked-list demonstrations

Use one working file in this directory:

```sh
cp -n 00-empty.c live-list.c
vim live-list.c
```

Save with `:w`, then run `:!make run` or `:!make valgrind` in Vim.
No keyboard input is needed. The default file is `live-list.c`.
Use `make run FILE=04-head-address.c` to run a saved reference directly.

Follow the teacher guide for when to run. Files are recovery states, not a list
of programs to run one after another. To recover from Vim:

```vim
:!cp 07-head-fixed.c live-list.c
:e!
:!make valgrind
```

`cp` replaces the working file; `:e!` reloads it and discards unsaved edits.
`cp -n` is only for initial preparation and preserves an existing working file.

| Files | Purpose |
|---|---|
| 00–02 | Empty list, allocate a node, assign head |
| 03–04 | Observe a copied pointer failing to update head; repair with &head |
| 05–07 | Insert at the head: starting state, lost chain, corrected order |
| 08–10 | Insert after B: starting state, lost suffix, corrected order |
| 11–12 | Append after D and retain the NULL terminator |
| 13–14 | Start from ABCD; remove and free A |
| 15 | Start from ABCD; remove and free B |
| 16 | Start from ABCD; find C and remove D |

03, 06 and 09 deliberately leak. Valgrind should exit with an error; inspect
its report. Correct examples release all their nodes. `list-support.h` provides
node creation, ABCD setup, printing and cleanup for the operation comparisons.
The int field stores character constants in those comparisons, printed with %c
to match A–E in the diagrams. The first node example uses the number 1.

The deletion traces assume the pictured ABCD chain exists. For general code,
check for an empty list and handle the sole-node case before using a predecessor
loop. The teacher guide explains these cases without changing the source scope.
