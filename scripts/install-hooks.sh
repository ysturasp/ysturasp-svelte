#!/bin/bash

echo "Установка git hooks..."

cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

echo "Генерация changelog перед коммитом..."

./scripts/generate-changelog.sh

if git diff --cached --quiet CHANGELOG.md && git diff --quiet CHANGELOG.md && ! git ls-files --others --exclude-standard | grep -q "CHANGELOG.md"; then
    echo "Changelog не изменился"
else
    echo "Changelog обновлен, добавляем в коммит..."
    git add CHANGELOG.md static/CHANGELOG.md
fi

exit 0
EOF

chmod +x .git/hooks/pre-commit

echo "Git hooks установлены!"
echo "Теперь changelog будет автоматически генерироваться перед каждым коммитом" 