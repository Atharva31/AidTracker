#!/bin/bash

# =====================================================
# AidTracker - Run All Database Tests
# =====================================================
# Executes all test scripts and generates results
# =====================================================

set -e  # Exit on any error

echo "======================================================================"
echo "AidTracker Database Test Suite"
echo "======================================================================"
echo ""

# Configuration
MYSQL_CONTAINER="aidtracker_mysql"
MYSQL_USER="root"
MYSQL_PASSWORD="rootpassword123"
MYSQL_DATABASE="aidtracker_db"
TEST_DIR="database/tests"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if MySQL container is running
echo "Checking MySQL container status..."
if ! docker ps | grep -q "$MYSQL_CONTAINER"; then
    echo -e "${RED}Error: MySQL container '$MYSQL_CONTAINER' is not running${NC}"
    echo "Please start the database with: docker-compose up mysql"
    exit 1
fi

echo -e "${GREEN}[PASS] MySQL container is running${NC}"
echo ""

# Function to run a SQL test file
run_test() {
    local test_file=$1
    local test_name=$(basename "$test_file")
    
    echo "======================================================================"
    echo "Running: $test_name"
    echo "======================================================================"
    
    if docker exec -i "$MYSQL_CONTAINER" mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < "$test_file"; then
        echo -e "${GREEN}[PASS] $test_name PASSED${NC}"
        return 0
    else
        echo -e "${RED}[FAIL] $test_name FAILED${NC}"
        return 1
    fi
}

# Run all tests
total_tests=0
passed_tests=0
failed_tests=0

# Array of test files in order
test_files=(
    "$TEST_DIR/01_test_crud_operations.sql"
    "$TEST_DIR/02_test_complex_queries.sql"
    "$TEST_DIR/03_test_index_performance.sql"
    "$TEST_DIR/04_test_transactions.sql"
    "$TEST_DIR/05_test_data_integrity.sql"
)

echo "Starting test execution..."
echo ""

for test_file in "${test_files[@]}"; do
    if [ -f "$test_file" ]; then
        ((total_tests++))
        
        if run_test "$test_file"; then
            ((passed_tests++))
        else
            ((failed_tests++))
        fi
        
        echo ""
        sleep 1  # Brief pause between tests
    else
        echo -e "${YELLOW}Warning: Test file not found: $test_file${NC}"
        echo ""
    fi
done

# Summary
echo "======================================================================"
echo "Test Execution Summary"
echo "======================================================================"
echo "Total Tests:  $total_tests"
echo -e "Passed:       ${GREEN}$passed_tests${NC}"

if [ $failed_tests -gt 0 ]; then
    echo -e "Failed:       ${RED}$failed_tests${NC}"
else
    echo -e "Failed:       ${GREEN}$failed_tests${NC}"
fi

echo ""

if [ $failed_tests -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}          ALL TESTS PASSED! DATABASE IS VERIFIED!           ${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}          SOME TESTS FAILED - REVIEW OUTPUT ABOVE            ${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 1
fi
