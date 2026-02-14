#!/usr/bin/env powershell
# TaskMaster Quick Demo Startup Script
# Usage: .\start-demo.ps1

param(
    [string]$Mode = "docker",  # docker or manual
    [switch]$Help
)

if ($Help) {
    Write-Host "TaskMaster Demo Startup Script`n" -ForegroundColor Green
    Write-Host "Usage: .\start-demo.ps1 [-Mode docker|manual]`n"
    Write-Host "Options:"
    Write-Host "  -Mode docker   : Start with Docker Compose (default)"
    Write-Host "  -Mode manual   : Start with npm (requires manual setup)"
    exit
}

Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     TaskMaster - Quick Demo Launcher   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$ProjectPath = "c:\Users\LOQ\OneDrive\Documents\01project\TaskMaster"
cd $ProjectPath

if ($Mode -eq "docker") {
    Write-Host "🐳 Starting with Docker Compose..." -ForegroundColor Yellow
    Write-Host "Pulling latest images..."
    docker-compose pull
    
    Write-Host "Starting containers..." -ForegroundColor Yellow
    docker-compose up -d
    
    Write-Host "Waiting for services to start (30 seconds)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    
    Write-Host "✅ Services Started!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Services Running:" -ForegroundColor Cyan
    Write-Host "  📱 Frontend:  http://localhost:3000" -ForegroundColor Green
    Write-Host "  🔧 Backend:   http://localhost:5000" -ForegroundColor Green
    Write-Host "  🗄️  MongoDB:   localhost:27017" -ForegroundColor Green
    Write-Host ""
    Write-Host "Opening http://localhost:3000 in browser..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:3000"
    
    Write-Host ""
    Write-Host "Demo Ready! 🚀" -ForegroundColor Green
    Write-Host "To stop: docker-compose down" -ForegroundColor Gray
    
} elseif ($Mode -eq "manual") {
    Write-Host "📝 Manual Startup Mode" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Follow these steps:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1️⃣  Backend Server (Terminal 1):" -ForegroundColor Yellow
    Write-Host "   cd server" -ForegroundColor Gray
    Write-Host "   npm install" -ForegroundColor Gray
    Write-Host "   npm start" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2️⃣  Frontend (Terminal 2):" -ForegroundColor Yellow
    Write-Host "   cd client" -ForegroundColor Gray
    Write-Host "   npm install" -ForegroundColor Gray
    Write-Host "   npm start" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3️⃣  MongoDB (Terminal 3):" -ForegroundColor Yellow
    Write-Host "   Option A: Start MongoDB service" -ForegroundColor Gray
    Write-Host "   Option B: Use MongoDB Atlas (Cloud)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "⏳ Wait for all to start, then frontend opens automatically on port 3000" -ForegroundColor Cyan
    
} else {
    Write-Host "❌ Unknown mode: $Mode" -ForegroundColor Red
    Write-Host "Use -Mode docker or -Mode manual" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Need help? Check DEMO_SCRIPT.md for complete guide" -ForegroundColor Gray
