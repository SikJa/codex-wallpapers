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
  Start-Process -FilePath $node -ArgumentList ('"'+$entry+'"') -WorkingDirectory $repository -WindowStyle Hidden -RedirectStandardOutput $out -RedirectStandardError $err|Out-Null
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
