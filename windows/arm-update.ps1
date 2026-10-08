[CmdletBinding()]
param([Parameter(Mandatory)][string]$Repository,[Parameter(Mandatory)][string]$DataRoot,[Parameter(Mandatory)][string]$PreviousVersion)
$ErrorActionPreference='Stop'
# An on-demand Windows task survives the updater closing Electron and its
# executor. No recurring trigger, process watcher, or logon task is installed.
$taskName='CodexWallpapers Update '+[guid]::NewGuid().ToString()
foreach($argument in @($Repository,$DataRoot,$PreviousVersion)){if($argument.Contains('"')){throw 'Invalid task argument'}}
$script=Join-Path $Repository 'windows/update-handoff.ps1'
if(-not(Test-Path -LiteralPath $script -PathType Leaf)){throw 'Update helper missing'}
$arguments='-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "'+$script+'" -Repository "'+$Repository+'" -DataRoot "'+$DataRoot+'" -PreviousVersion "'+$PreviousVersion+'" -TaskName "'+$taskName+'"'
$action=New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $arguments
$principal=New-ScheduledTaskPrincipal -UserId ([Security.Principal.WindowsIdentity]::GetCurrent().Name) -LogonType Interactive -RunLevel Limited
$settings=New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 17) -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName $taskName -Action $action -Principal $principal -Settings $settings -Description 'One update-button handoff; removes itself after completion.'|Out-Null
try{Start-ScheduledTask -TaskName $taskName}catch{Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue;throw}
