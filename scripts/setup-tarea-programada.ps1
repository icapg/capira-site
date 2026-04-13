# setup-tarea-programada.ps1
#
# Crea una tarea programada en Windows para ejecutar la actualización
# mensual de datos DGT el día 16 de cada mes a las 09:00.
#
# DGT publica los datos alrededor del día 15; corremos el 16 para
# asegurarnos de que ya estén disponibles.
#
# Ejecutar UNA VEZ como Administrador:
#   PowerShell -ExecutionPolicy Bypass -File scripts\setup-tarea-programada.ps1

$TaskName   = "DGT-Update-Mensual"
$ScriptDir  = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$NodePath   = (Get-Command node -ErrorAction Stop).Source
$ScriptPath = Join-Path $ScriptDir "scripts\dgt-update.mjs"
$LogDir     = Join-Path $ScriptDir "logs"
$LogFile    = Join-Path $LogDir "dgt-update.log"

# Crear directorio de logs si no existe
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }

Write-Host "Configurando tarea programada: $TaskName" -ForegroundColor Cyan
Write-Host "  Directorio: $ScriptDir"
Write-Host "  Node: $NodePath"
Write-Host "  Script: $ScriptPath"
Write-Host "  Log: $LogFile"
Write-Host ""

# Comando que ejecuta el script y guarda el log con timestamp
$Command = @"
cmd /c "cd /d `"$ScriptDir`" && echo. >> `"$LogFile`" && echo === %date% %time% === >> `"$LogFile`" && `"$NodePath`" scripts\dgt-update.mjs >> `"$LogFile`" 2>&1"
"@

# Trigger: día 16 de cada mes a las 09:00
$Trigger = New-ScheduledTaskTrigger -Monthly -DaysOfMonth 16 -At "09:00"

# Acción
$Action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-WindowStyle Hidden -Command $Command"

# Configuración: correr aunque el usuario no esté logueado, con los permisos del usuario actual
$Settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -RunOnlyIfNetworkAvailable `
  -ExecutionTimeLimit (New-TimeSpan -Hours 4) `
  -MultipleInstances IgnoreNew

# Registrar (sobreescribe si ya existe)
$existente = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existente) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
  Write-Host "  Tarea anterior eliminada." -ForegroundColor Yellow
}

Register-ScheduledTask `
  -TaskName $TaskName `
  -Trigger $Trigger `
  -Action $Action `
  -Settings $Settings `
  -RunLevel Highest `
  -Force | Out-Null

Write-Host "✅ Tarea '$TaskName' creada exitosamente." -ForegroundColor Green
Write-Host ""
Write-Host "Próximas ejecuciones:" -ForegroundColor Cyan
$task = Get-ScheduledTask -TaskName $TaskName
$taskInfo = $task | Get-ScheduledTaskInfo
Write-Host "  Próxima vez: $($taskInfo.NextRunTime)"
Write-Host ""
Write-Host "Para ejecutar manualmente ahora:" -ForegroundColor Cyan
Write-Host "  Start-ScheduledTask -TaskName '$TaskName'"
Write-Host ""
Write-Host "Para ver el log:" -ForegroundColor Cyan
Write-Host "  Get-Content '$LogFile' -Tail 50"
Write-Host ""
Write-Host "Para eliminar la tarea:" -ForegroundColor Cyan
Write-Host "  Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false"
