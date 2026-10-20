param([int]$Port = 8090)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$localPhp = Join-Path $projectRoot '.tools/php/php.exe'
$phpCommand = Get-Command php -ErrorAction SilentlyContinue
$phpPath = if ($phpCommand) { $phpCommand.Source } elseif (Test-Path -LiteralPath $localPhp) { $localPhp } else { throw 'Install PHP 8.4+ or use Docker Compose as described in README.md.' }
Write-Host "Preview: http://127.0.0.1:$Port/uz"
& $phpPath -S "127.0.0.1:$Port" -t (Join-Path $projectRoot 'app/public') (Join-Path $projectRoot 'scripts/preview-router.php')
