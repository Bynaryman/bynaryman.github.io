CC = gcc
CFLAGS = -std=c17 -Wall -Wextra -Wpedantic -Werror=vla -O0 -g
FILE ?= 01-copy-alias.c
.PHONY: run valgrind clean FORCE
program: $(FILE) FORCE
	$(CC) $(CFLAGS) $(FILE) -o $@
run: program
	./program
valgrind: program
	../../scripts/valgrind.sh --leak-check=full --track-origins=yes --error-exitcode=99 ./program
clean:
	rm -f program
FORCE:
