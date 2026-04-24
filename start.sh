#!/bin/bash

echo "=========================================="
echo "  AI Veterinary Clinic Manager"
echo "  Starting Application..."
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Kill processes on ports 4000 and 3000
echo -e "${YELLOW}Cleaning up used ports...${NC}"
for PORT in 4000 3000; do
  PID=$(lsof -ti :$PORT 2>/dev/null)
  if [ -n "$PID" ]; then
    echo -e "${RED}Killing process on port $PORT (PID: $PID)${NC}"
    kill -9 $PID 2>/dev/null
    sleep 1
  fi
done

echo -e "${GREEN}Ports cleaned.${NC}"

# Check if PostgreSQL is running
if ! pg_isready -q 2>/dev/null; then
  echo -e "${YELLOW}Starting PostgreSQL...${NC}"
  brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null
  sleep 2
fi

# Create database if not exists
echo -e "${BLUE}Setting up database...${NC}"
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'vet_clinic'" 2>/dev/null | grep -q 1 || \
  createdb -U postgres vet_clinic 2>/dev/null || \
  psql -tc "SELECT 1 FROM pg_database WHERE datname = 'vet_clinic'" 2>/dev/null | grep -q 1 || \
  createdb vet_clinic 2>/dev/null

echo -e "${GREEN}Database ready.${NC}"

# Install server dependencies
echo -e "${BLUE}Installing server dependencies...${NC}"
cd "$PROJECT_DIR/server"
npm install --silent 2>&1 | tail -1

# Install client dependencies
echo -e "${BLUE}Installing client dependencies...${NC}"
cd "$PROJECT_DIR/client"
npm install --silent 2>&1 | tail -1

# Seed database
echo -e "${BLUE}Seeding database with sample data...${NC}"
cd "$PROJECT_DIR/server"
node seeds/seed.js
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Database seeded successfully!${NC}"
else
  echo -e "${RED}Warning: Seed may have had issues. Check database connection.${NC}"
fi

# Start backend with watch mode (auto-reload on changes)
echo -e "${BLUE}Starting backend server (port 4000) with auto-reload...${NC}"
cd "$PROJECT_DIR/server"
npm run dev &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 2

# Start frontend with hot reload (Vite already has HMR)
echo -e "${BLUE}Starting frontend (port 3000) with hot reload...${NC}"
cd "$PROJECT_DIR/client"
npm run dev &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}=========================================="
echo -e "  Application is starting!"
echo -e "==========================================${NC}"
echo ""
echo -e "  Frontend: ${BLUE}http://localhost:3000${NC}"
echo -e "  Backend:  ${BLUE}http://localhost:4000${NC}"
echo ""
echo -e "  Demo Login:"
echo -e "    Email:    ${YELLOW}admin@vetclinic.com${NC}"
echo -e "    Password: ${YELLOW}password123${NC}"
echo ""
echo -e "  ${GREEN}Both servers auto-reload on code changes.${NC}"
echo -e "  Press ${RED}Ctrl+C${NC} to stop all services."
echo ""

# Cleanup on exit
cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down...${NC}"
  kill $BACKEND_PID 2>/dev/null
  kill $FRONTEND_PID 2>/dev/null
  # Clean up any remaining processes on the ports
  for PORT in 4000 3000; do
    PID=$(lsof -ti :$PORT 2>/dev/null)
    if [ -n "$PID" ]; then
      kill -9 $PID 2>/dev/null
    fi
  done
  echo -e "${GREEN}All services stopped.${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for both processes
wait
