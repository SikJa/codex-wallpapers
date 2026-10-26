[CmdletBinding()]
param([string]$InstallRoot)
$ErrorActionPreference='Stop'
$repo=Split-Path $PSScriptRoot -Parent
if(-not $InstallRoot){$InstallRoot=Join-Path $env:LOCALAPPDATA 'CodexWallpapers/app'}
$target=[IO.Path]::GetFullPath($InstallRoot).TrimEnd('\')
$manifest=Get-Content -LiteralPath (Join-Path $target 'installation.json') -Raw|ConvertFrom-Json
if($manifest.schema -ne 1 -or [IO.Path]::GetFullPath($manifest.root).TrimEnd('\') -ne $target -or (Split-Path $target -Leaf) -ne 'app'){throw 'Installation identity mismatch.'}
if([IO.Path]::GetFullPath($repo).TrimEnd('\') -eq $target){throw 'Run this command from the updated repository, not the installed copy.'}
$active=@(Get-CimInstance Win32_Process -Filter "Name='node.exe' OR Name='CodexWallpapers.exe'" | Where-Object {($_.ExecutablePath -and $_.ExecutablePath.StartsWith($target+'\',[StringComparison]::OrdinalIgnoreCase)) -or ($_.CommandLine -and $_.CommandLine.IndexOf($target,[StringComparison]::OrdinalIgnoreCase) -ge 0)})
if($active.Count){throw 'The installed launcher or listener is still running. Quit Codex normally and wait for its wallpaper listener to exit. Nothing was changed.'}
$stamp=[guid]::NewGuid().ToString('N')
$stage=$target+'.staging-'+$stamp
$backup=$target+'.backup-'+$stamp
New-Item -ItemType Directory -Path $stage|Out-Null
# Stage before moving anything. User media/preferences live outside app.
foreach($folder in @('src','windows')){Copy-Item -LiteralPath (Join-Path $repo $folder) -Destination $stage -Recurse}
foreach($file in @('compatibility.json','package.json')){Copy-Item -LiteralPath (Join-Path $repo $file) -Destination $stage}
foreach($file in @('CodexWallpapers.exe','official.ico','app-id.txt')){Copy-Item -LiteralPath (Join-Path $target ('windows/'+$file)) -Destination (Join-Path $stage 'windows')}
$compiler=Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
& $compiler /nologo /target:winexe ('/out:'+(Join-Path $stage 'windows/CodexWallpapers.exe')) ('/win32icon:'+(Join-Path $stage 'windows/official.ico')) (Join-Path $stage 'windows/Launcher.cs')
if($LASTEXITCODE -ne 0){throw "Launcher compilation failed. Existing installation preserved; staging: $stage"}
$manifest|Add-Member -NotePropertyName repositoryVersion -NotePropertyValue ((Get-Content (Join-Path $repo 'package.json') -Raw|ConvertFrom-Json).version) -Force
$manifest|ConvertTo-Json|Set-Content -LiteralPath (Join-Path $stage 'installation.json') -Encoding UTF8
# Keep the same installed path and shortcut; rollback if promotion fails.
Move-Item -LiteralPath $target -Destination $backup
try{Move-Item -LiteralPath $stage -Destination $target}catch{Move-Item -LiteralPath $backup -Destination $target;throw}
Write-Output "Updated installation: $target. Backup: $backup. Wallpapers and preferences preserved. No app was restarted."
