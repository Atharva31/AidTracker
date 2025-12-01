#!/bin/bash
set -e

echo "🚀 Running AidTracker initialization scripts..."

# Function to run sql file
run_sql() {
    echo "📜 Executing $1..."
    mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" < "$1"
}

# Run schemas in order
echo "📂 Processing schemas..."
for f in /docker-entrypoint-initdb.d/schemas/*.sql; do
    [ -e "$f" ] || continue
    run_sql "$f"
done

# Run seeds
echo "🌱 Processing seeds..."
for f in /docker-entrypoint-initdb.d/seeds/*.sql; do
    [ -e "$f" ] || continue
    run_sql "$f"
done

echo "✅ Database initialization complete!"
