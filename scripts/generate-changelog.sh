#!/bin/bash

SINCE_DATE=${1:-"2024-09-01"}

echo "Генерация changelog с $SINCE_DATE..."

git log --since="$SINCE_DATE" --pretty=format:"- %s (%an, %ad)%n%b" --date=short --shortstat | \
  sed 's/([^)]*, /\(ysturasp, /' | \
  awk '
    /^- / {
      if (msg != "") {
        if (!has_stat) msg = msg " [0 insertions(+), 0 deletions(-)]";
        print msg;
      }
      msg = $0;
      has_stat = 0;
      next;
    }
    /insertions|\(.*changed/ {
      gsub(/^[ \t]+|[ \t]+$/, "", $0);
      msg = msg " [" $0 "]";
      has_stat = 1;
    }
    END {
      if (msg != "") {
        if (!has_stat) msg = msg " [0 insertions(+), 0 deletions(-)]";
        print msg;
      }
    }
  ' > CHANGELOG.md

cp CHANGELOG.md static/CHANGELOG.md

echo "Changelog обновлен: CHANGELOG.md и static/CHANGELOG.md"
echo "Записей создано: $(wc -l < CHANGELOG.md)" 