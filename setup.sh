#!/bin/bash
# Setup Script for Unified Education Portal (Linux/Mac)

echo "========================================"
echo "  Unified Education Portal Setup"
echo "========================================"
echo ""

# Backend Setup
echo "[1/4] Setting up Backend..."
cd backend

echo "Creating virtual environment..."
python3 -m venv venv

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo ""
echo "Backend setup complete!"
echo ""
echo "IMPORTANT: Please configure MySQL databases:"
echo "  1. Create databases: lsc_portal_db, online_edu, lsc_admindb"
echo "  2. Update password in backend/backend/settings.py"
echo "  3. Run migrations: python manage.py migrate"
echo ""

cd ..

# Frontend Setup
echo "[2/4] Setting up Frontend..."
cd frontend

echo "Installing Node dependencies..."
npm install

echo ""
echo "Frontend setup complete!"
echo ""

cd ..

echo "========================================"
echo "  Setup Complete!"
echo "========================================"
echo ""
echo "Next Steps:"
echo "  1. Configure MySQL databases"
echo "  2. Update backend/backend/settings.py"
echo "  3. Run: cd backend && python manage.py migrate"
echo "  4. Run: ./start.sh to launch the application"
echo ""

# Make start.sh executable
chmod +x start.sh
echo "Made start.sh executable"
