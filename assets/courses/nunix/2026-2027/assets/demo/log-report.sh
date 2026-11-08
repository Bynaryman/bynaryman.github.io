#!/bin/bash
if [ "$#" -eq 0 ]; then
    echo "Usage: $0 LOGFILE..." >&2
    exit 1
fi

read -r -p "Pattern to count: " pattern
echo "Searching for: $pattern"

report_file() {
    local matches
    matches=$(grep "$pattern" "$1" | wc -l)
    echo "$1: $matches matching lines"
}

report="search-report.txt"
echo "Matching lines for: $pattern" > "$report"
for logfile in "$@"; do
    if [ -f "$logfile" ] && [ -r "$logfile" ]; then
        report_file "$logfile" >> "$report"
    else
        echo "Cannot read file: $logfile" >&2
        exit 1
    fi
done
echo "Report saved in $report"
