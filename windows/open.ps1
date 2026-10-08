[CmdletBinding()]
param([string]$Repository)
$ErrorActionPreference='Stop'
. "$PSScriptRoot/identity.ps1"
. "$PSScriptRoot/port.ps1"
if(-not $Repository){$Repository=Split-Path $PSScriptRoot -Parent}
$dataRoot=if($env:CODEX_WALLPAPERS_DATA){$env:CODEX_WALLPAPERS_DATA}else{Join-Path $env:LOCALAPPDATA 'CodexWallpapers'}
New-Item -ItemType Directory -Path $dataRoot -Force|Out-Null
$mutex=New-Object Threading.Mutex($false,'Local.CodexWallpapers.Start')
$locked=$false;$record=@{time=(Get-Date).ToString('o');state='checking';launches=0}
try {
 try{$locked=$mutex.WaitOne(0)}catch [Threading.AbandonedMutexException] {$locked=$true}
 if(-not $locked){return}
 $app=Get-CWPackage
 $record.version=$app.Version
 if((Get-CWProcesses $app).Count){Start-CWPackage $app;$record.state='already-open-activated';return}
 $node=Get-Command node.exe -ErrorAction SilentlyContinue
 $port=Get-CWAvailablePort
 $record.port=$port
 # Inspect the verified Store package at each cold opening, including versions
 # installed by the official updater. Never download code or restart to retry.
 $supported=$node -and $null -ne $port
 if($supported){
   try {
     $probe=& $node.Source (Join-Path $Repository 'src/compatibility-probe.mjs') (Join-Path $app.Root 'app/resources/app.asar')
     $probeExit=$LASTEXITCODE
     $probe | Set-Content -LiteralPath (Join-Path $dataRoot 'compatibility-probe.json') -Encoding UTF8
     $supported=$probeExit -eq 0 -and ($probe|ConvertFrom-Json).compatible
     $record.compatibility='automatic-interface-probe'
   }catch{$supported=$false;$record.compatibility='probe-failed'}
 }
 if($supported){try{& $node.Source (Join-Path $Repository 'src/apply.mjs') --check 1> (Join-Path $dataRoot 'preflight.log') 2> (Join-Path $dataRoot 'preflight-error.log');$supported=$LASTEXITCODE -eq 0}catch{$supported=$false}}
 $record.launches=1
 if(-not $supported){Start-CWPackage $app;$record.state='opened-normal';return}
 Start-CWPackage $app "--remote-debugging-address=127.0.0.1 --remote-debugging-port=$port"
 $deadline=(Get-Date).AddSeconds(40);$ep=$null
 do {
  try{$v=Invoke-RestMethod "http://127.0.0.1:$port/json/version" -TimeoutSec 2 -MaximumRedirection 0;$browserId=([Uri]$v.webSocketDebuggerUrl).Segments[-1];$candidate=@{port=$port;browserId=$browserId;version=$app.Version};if(Test-CWEndpoint $candidate $app){$ep=$candidate;break}}catch{}
  Start-Sleep -Milliseconds 400
 }while((Get-Date) -lt $deadline)
 if(-not $ep){$record.state='opened-normal-no-endpoint';return}
 $ep|ConvertTo-Json|Set-Content (Join-Path $dataRoot 'endpoint.json') -Encoding UTF8
 # This helper watches documents, never processes to restart. It exits when this
 # browser identity disappears. Ctrl+Shift+N is handled as another document.
 Start-Process -FilePath $node.Source -ArgumentList ('"'+(Join-Path $Repository 'src/apply.mjs')+'" --watch') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $dataRoot 'listener.log') -RedirectStandardError (Join-Path $dataRoot 'listener-error.log')|Out-Null
 $record.state='opened-awaiting-renderer'
}catch{$record.state='stopped';$record.error=$_.Exception.Message}
finally{if($locked){$record|ConvertTo-Json|Set-Content (Join-Path $dataRoot 'launch.json') -Encoding UTF8;$mutex.ReleaseMutex()};$mutex.Dispose()}
