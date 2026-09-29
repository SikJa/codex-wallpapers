[CmdletBinding()]
param(
  [switch]$InstallStartup,
  [string]$DataRoot
)
$ErrorActionPreference='Stop'
$repository=Split-Path $PSScriptRoot -Parent
$entry=Join-Path $repository 'obs-overlay\server.mjs'
$built=Join-Path $repository 'obs-overlay\dist\index.html'
if(-not (Test-Path -LiteralPath $built)){throw 'Build the OBS overlay first: npm run build:obs'}
$node=(Get-Command node.exe -ErrorAction Stop).Source
$storage=if($DataRoot){$DataRoot}elseif($env:CODEX_WALLPAPERS_DATA){$env:CODEX_WALLPAPERS_DATA}else{Join-Path $env:LOCALAPPDATA 'CodexWallpapers'}
$storage=[IO.Path]::GetFullPath($storage)
New-Item -ItemType Directory -Path $storage -Force|Out-Null
$env:CODEX_WALLPAPERS_DATA=$storage
$port=if($env:CW_OBS_PORT){[int]$env:CW_OBS_PORT}else{8794}
$existing=Get-NetTCPConnection -LocalAddress '127.0.0.1' -LocalPort $port -State Listen -ErrorAction SilentlyContinue|Select-Object -First 1
if($existing){
  $owner=Get-CimInstance Win32_Process -Filter "ProcessId=$($existing.OwningProcess)" -ErrorAction SilentlyContinue
  if(-not $owner -or $owner.ExecutablePath -ne $node -or $owner.CommandLine -notmatch '(?:^|[\\/\s])obs-overlay[\\/]server\.mjs(?:\s|"|$)'){throw "Port $port is already in use by another application"}
}else{
  $out=Join-Path $storage 'obs-overlay.log'
  $err=Join-Path $storage 'obs-overlay-error.log'
  # A process spawned directly by Codex can inherit its Windows job and disappear
  # when Codex exits. Task Scheduler starts the server outside that process tree.
  # The existing Startup shortcut still invokes this entrypoint on login.
  $runner=Join-Path $storage 'obs-overlay-run.ps1'
  $quote={param([string]$value) "'"+$value.Replace("'","''")+"'"}
  $body=@(
    "`$env:CODEX_WALLPAPERS_DATA = $(& $quote $storage)",
    "`$env:CW_OBS_PORT = '$port'",
    "Set-Location -LiteralPath $(& $quote $repository)",
    "& $(& $quote $node) $(& $quote $entry) 1>> $(& $quote $out) 2>> $(& $quote $err)"
  ) -join "`r`n"
  Set-Content -LiteralPath $runner -Value $body -Encoding UTF8
  $hash=[Security.Cryptography.SHA256]::Create()
  try{$suffix=([BitConverter]::ToString($hash.ComputeHash([Text.Encoding]::UTF8.GetBytes($storage.ToLowerInvariant())))).Replace('-','').Substring(0,12)}finally{$hash.Dispose()}
  $taskName="Codex Wallpapers OBS $port $suffix"
  $account=[Security.Principal.WindowsIdentity]::GetCurrent().Name
  $action=New-ScheduledTaskAction -Execute (Get-Command powershell.exe).Source -Argument ('-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "'+$runner+'"') -WorkingDirectory $repository
  $principal=New-ScheduledTaskPrincipal -UserId $account -LogonType Interactive -RunLevel Limited
  $settings=New-ScheduledTaskSettingsSet -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
  Register-ScheduledTask -TaskName $taskName -Action $action -Principal $principal -Settings $settings -Description 'Local OBS usage server, independent of Codex. Does not launch or restart Codex.' -Force|Out-Null
  Start-ScheduledTask -TaskName $taskName
  $ready=$false
  for($i=0;$i -lt 20;$i++){
    try{$response=Invoke-WebRequest "http://127.0.0.1:$port/state" -TimeoutSec 1 -UseBasicParsing;if($response.StatusCode -eq 200){$ready=$true;break}}catch{}
    Start-Sleep -Milliseconds 150
  }
  if(-not $ready){throw "OBS overlay did not start. See $err"}
}
if($InstallStartup){
  $startup=[Environment]::GetFolderPath('Startup')
  $shortcut=Join-Path $startup 'Codex Wallpapers OBS Usage.lnk'
  $shell=New-Object -ComObject WScript.Shell
  $link=$shell.CreateShortcut($shortcut)
  $link.TargetPath=(Get-Command powershell.exe).Source
  $arguments='-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "'+$PSCommandPath+'"'
  if($DataRoot){$arguments+=' -DataRoot "'+$storage+'"'}
  $link.Arguments=$arguments
  $link.WorkingDirectory=$repository
  $link.WindowStyle=7
  $link.Description='Local Codex usage overlay for OBS; never launches or restarts Codex.'
  $link.Save()
  Write-Output "Startup shortcut: $shortcut"
}
Write-Output "OBS overlay ready: http://127.0.0.1:$port/"
