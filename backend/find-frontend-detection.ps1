# find-frontend-detection.ps1
# Buscar la lógica de detección de entorno en el frontend

Write-Host "🔍 BUSCANDO LÓGICA DE DETECCIÓN DE ENTORNO" -ForegroundColor Green
Write-Host "=========================================="

# Buscar directorio del frontend
$frontendPaths = @("../frontend", "./frontend", "../odonto-frontend", "../odon-sys-frontend")
$frontendPath = $null

foreach ($path in $frontendPaths) {
    if (Test-Path $path) {
        $frontendPath = $path
        break
    }
}

if ($frontendPath) {
    Write-Host "✅ Frontend encontrado en: $frontendPath" -ForegroundColor Green
    
    Write-Host "`n📋 Estructura del frontend:" -ForegroundColor Yellow
    Get-ChildItem $frontendPath | Select-Object Name, Mode | Format-Table
    
    Write-Host "`n🔍 Archivos .env:" -ForegroundColor Yellow
    Get-ChildItem "$frontendPath\.env*" -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "📄 $($_.Name):" -ForegroundColor Cyan
        Get-Content $_.FullName | ForEach-Object { Write-Host "   $_" }
        Write-Host ""
    }
    
    Write-Host "`n🔍 Buscando archivos con configuración de API:" -ForegroundColor Yellow
    $patterns = @("localhost", "98.82.131.153", "window.location", "process.env", "NODE_ENV", "API_URL", "baseURL")
    
    Get-ChildItem "$frontendPath\src" -Recurse -Include "*.js", "*.jsx", "*.ts", "*.tsx" -ErrorAction SilentlyContinue | ForEach-Object {
        $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
        $hasPattern = $false
        
        foreach ($pattern in $patterns) {
            if ($content -match $pattern) {
                $hasPattern = $true
                break
            }
        }
        
        if ($hasPattern) {
            Write-Host "📄 $($_.Name) ($($_.DirectoryName)):" -ForegroundColor Cyan
            $lines = Get-Content $_.FullName
            for ($i = 0; $i -lt $lines.Count; $i++) {
                foreach ($pattern in $patterns) {
                    if ($lines[$i] -match $pattern) {
                        $start = [Math]::Max(0, $i - 2)
                        $end = [Math]::Min($lines.Count - 1, $i + 2)
                        for ($j = $start; $j -le $end; $j++) {
                            $marker = if ($j -eq $i) { ">>> " } else { "    " }
                            Write-Host "$marker$($j + 1): $($lines[$j])" -ForegroundColor White
                        }
                        Write-Host ""
                        break
                    }
                }
            }
        }
    }
    
    Write-Host "`n🔍 Verificando package.json:" -ForegroundColor Yellow
    $packageJson = "$frontendPath\package.json"
    if (Test-Path $packageJson) {
        $package = Get-Content $packageJson | ConvertFrom-Json
        Write-Host "📦 Scripts:" -ForegroundColor Cyan
        $package.scripts.PSObject.Properties | ForEach-Object {
            Write-Host "   $($_.Name): $($_.Value)"
        }
        
        Write-Host "`n📦 Dependencias relacionadas:" -ForegroundColor Cyan
        $package.dependencies.PSObject.Properties | Where-Object { $_.Name -match "axios|fetch|api" } | ForEach-Object {
            Write-Host "   $($_.Name): $($_.Value)"
        }
    }
    
} else {
    Write-Host "❌ No se encontró el directorio del frontend" -ForegroundColor Red
    Write-Host "💡 Estructura actual:" -ForegroundColor Yellow
    Get-ChildItem | Select-Object Name, Mode | Format-Table
    
    Write-Host "💡 Directorios buscados:" -ForegroundColor Yellow
    $frontendPaths | ForEach-Object { Write-Host "   $_" }
}

Write-Host "`n🎯 MANUAL SEARCH:" -ForegroundColor Yellow
Write-Host "Si no encuentras nada automáticamente, busca manualmente:"
Write-Host "1. Archivos que contengan: 'localhost' Y '98.82.131.153'"
Write-Host "2. Archivos en src/ con nombres como: config, api, service"
Write-Host "3. Variables como: API_BASE_URL, baseURL, API_URL"