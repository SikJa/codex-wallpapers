[CmdletBinding()]
param([Parameter(Mandatory)][string]$Repository,[Parameter(Mandatory)][string]$DataRoot,[Parameter(Mandatory)][string]$PreviousVersion,[string]$TaskName)
$ErrorActionPreference='Stop'
. "$PSScriptRoot/identity.ps1"
$mutex=New-Object Threading.Mutex($false,'Local.CodexWallpapers.UpdateHandoff')
$locked=$false
$report=Join-Path $DataRoot 'update-handoff.json'
$record=@{time=(Get-Date).ToString('o');previousVersion=$PreviousVersion;state='starting';reopens=0}
function Save-Handoff {$record|ConvertTo-Json|Set-Content -LiteralPath $report -Encoding UTF8}
try {
 try{$locked=$mutex.WaitOne(0)}catch [Threading.AbandonedMutexException]{$locked=$true}
 if(-not $locked){return}
 $old=Get-CWPackage
 if($old.Version -ne $PreviousVersion){throw 'Package changed before handoff was armed'}
 $backup=Join-Path $DataRoot ('update-backup-'+[guid]::NewGuid().ToString())
 New-Item -ItemType Directory -Path $backup|Out-Null
 foreach($name in @('preferences.json','library.json')){if(Test-Path -LiteralPath (Join-Path $DataRoot $name)){Copy-Item -LiteralPath (Join-Path $DataRoot $name) -Destination (Join-Path $backup $name)}}
 $record.state='waiting-for-official-update';Save-Handoff
 $deadline=(Get-Date).AddMinutes(15);$new=$null
 do {
  try{$candidate=Get-CWPackage;if($candidate.Version -ne $PreviousVersion -and @(Get-CWProcesses $old).Count -eq 0){$new=$candidate;break}}catch{}
  Start-Sleep -Seconds 2
 }while((Get-Date) -lt $deadline)
 if(-not $new){throw 'Official update did not finish within 15 minutes; no reopening attempted'}
 Start-Sleep -Seconds 5
 if((Get-CWPackage).Version -ne $new.Version){throw 'Package changed again; handoff cancelled'}
 $config=Join-Path $DataRoot 'update-launcher.json'
 $launcher=$null
 if(Test-Path -LiteralPath $config){$launcher=(Get-Content -LiteralPath $config -Raw|ConvertFrom-Json).launcher;if(-not(Test-Path -LiteralPath $launcher -PathType Leaf)){throw 'Configured launcher missing'}}
 $processes=@(Get-CWProcesses $new)
 # If the official updater already preserved our validated endpoint, leave it alone.
 try{$ep=Get-Content -LiteralPath (Join-Path $DataRoot 'endpoint.json') -Raw|ConvertFrom-Json;if(Test-CWEndpoint $ep $new){$record.state='personalized-endpoint-preserved';return}}catch{}
 $record.version=$new.Version;$record.state='handoff-once';Save-Handoff
 foreach($main in @($processes|Where-Object {$_.CommandLine -notmatch '--type='})){ $p=Get-Process -Id $main.ProcessId -ErrorAction SilentlyContinue;if($p){[void]$p.CloseMainWindow()} }
 $closeDeadline=(Get-Date).AddSeconds(5)
 while(@(Get-CWProcesses $new).Count -and (Get-Date) -lt $closeDeadline){Start-Sleep -Milliseconds 400}
 foreach($snapshot in $processes){$still=@(Get-CWProcesses $new)|Where-Object {$_.ProcessId -eq $snapshot.ProcessId -and $_.CreationDate -eq $snapshot.CreationDate};if($still){Stop-Process -Id $snapshot.ProcessId -Force -ErrorAction SilentlyContinue}}
 Start-Sleep -Seconds 2
 if(@(Get-CWProcesses $new).Count){throw 'Updated Codex stayed open; no retry'}
 $env:CODEX_WALLPAPERS_DATA=$DataRoot
 $record.reopens=1
 if($launcher){Start-Process -FilePath $launcher -WindowStyle Hidden}
 else{& "$PSScriptRoot/open.ps1" -Repository $Repository}
 $record.state='reopened-once'
}catch{$record.state='failed';$record.error=$_.Exception.Message}
finally{if($locked){$record.finished=(Get-Date).ToString('o');Save-Handoff;$mutex.ReleaseMutex()};$mutex.Dispose();if($TaskName -match '^CodexWallpapers Update [0-9a-f-]{36}$'){Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue}}
