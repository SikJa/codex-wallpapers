[CmdletBinding()]
param([string]$InstallRoot)
$ErrorActionPreference='Stop'
if(-not $InstallRoot){$InstallRoot=Join-Path $env:LOCALAPPDATA 'CodexWallpapers/app'}
$resolved=[IO.Path]::GetFullPath($InstallRoot).TrimEnd('\')
$manifest=Get-Content -LiteralPath (Join-Path $resolved 'installation.json') -Raw|ConvertFrom-Json
if($manifest.schema -ne 1 -or [IO.Path]::GetFullPath($manifest.root).TrimEnd('\') -ne $resolved){throw 'Installation identity mismatch.'}
if((Split-Path $resolved -Leaf) -ne 'app'){throw 'Expected an app subdirectory, refusing to move a broader directory.'}
if(Test-Path -LiteralPath $manifest.shortcut){
 $shell=New-Object -ComObject WScript.Shell;$link=$shell.CreateShortcut($manifest.shortcut)
 if($link.TargetPath -ne (Join-Path $resolved 'windows/CodexWallpapers.exe')){throw 'Shortcut changed; preserving it.'}
 Move-Item -LiteralPath $manifest.shortcut -Destination (Join-Path $resolved 'removed-shortcut.lnk')
}
$backup=$resolved+'.disabled-'+(Get-Date -Format yyyyMMddHHmmss)
Move-Item -LiteralPath $resolved -Destination $backup
Write-Output "Disabled; recoverable files: $backup. Media preserved. Close Codex normally and open its original shortcut."
