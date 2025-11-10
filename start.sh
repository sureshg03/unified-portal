#!/bin/bash
# Unified Education Portal - Linux/Mac Startup Script
# This script starts both backend and frontend servers

echo "========================================"
echo "  Unified Education Portal"
echo "  Starting Backend and Frontend..."
echo "========================================"
echo ""

# Start Backend in background
echo "[1/2] Starting Django Backend Server..."
cd backend
source venv/bin/activate
python manage.py runserver &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 5

# Start Frontend in background
echo "[2/2] Starting React Frontend Server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================"
echo "  Servers Started!"
echo "========================================"
echo ""
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for user interrupt
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
