#!/bin/bash

# AidTracker Startup Script
# This script starts the entire AidTracker application

set -e

echo "================================================"
echo "  AidTracker - Aid Distribution Management"
echo "================================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found, creating from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

echo ""
echo "🚀 Building and starting services..."
echo "   This may take 2-3 minutes on first run..."
echo ""

# Start services
docker-compose up --build -d

echo ""
echo "⏳ Waiting for services to be ready..."
echo ""

# Wait for MySQL
echo "   Waiting for MySQL..."
until docker exec aidtracker_mysql mysqladmin ping -h localhost --silent 2>/dev/null; do
    printf '.'
    sleep 2
done
echo "   ✅ MySQL is ready"

# Wait for backend
echo "   Waiting for backend..."
until curl -s http://localhost:8000/health > /dev/null 2>&1; do
    printf '.'
    sleep 2
done
echo "   ✅ Backend is ready"

# Wait for frontend
echo "   Waiting for frontend..."
until curl -s http://localhost:3000 > /dev/null 2>&1; do
    printf '.'
    sleep 2
done
echo "   ✅ Frontend is ready"

echo ""
echo "================================================"
echo "  ✅ AidTracker is running!"
echo "================================================"
echo ""
echo "📊 Services:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:8000"
echo "   API Docs:  http://localhost:8000/docs"
echo ""
echo "🔍 Useful commands:"
echo "   View logs:       docker-compose logs -f"
echo "   Stop services:   docker-compose down"
echo "   Restart:         docker-compose restart"
echo ""
echo "📚 Documentation:"
echo "   README:          README.md"
echo "   Setup Guide:     docs/SETUP_GUIDE.md"
echo "   Concurrency:     docs/CONCURRENCY_DEMO.md"
echo ""
echo "Press Ctrl+C to view logs, or visit http://localhost:3000"
echo ""

# Follow logs
docker-compose logs -f
