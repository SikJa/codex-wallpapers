[CmdletBinding()]
param([switch]$Check,[string]$InstallRoot,[string]$ShortcutRoot)
$ErrorActionPreference='Stop'
. "$PSScriptRoot/identity.ps1"
$app=Get-CWPackage
$node=Get-Command node.exe -ErrorAction Stop
$nodeVersion=& $node.Source --version
if($LASTEXITCODE -ne 0 -or $nodeVersion -notmatch '^v(\d+)\.' -or [int]$Matches[1] -lt 22){throw 'Node 22 or newer required.'}
$compiler=Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
$icon=Join-Path $app.Root 'app/resources/chatgpt-app-dark.ico'
if(-not(Test-Path $compiler) -or -not(Test-Path $icon)){throw 'C# compiler or official multi-resolution icon unavailable.'}
$repo=Split-Path $PSScriptRoot -Parent
if($Check){@{version=$app.Version;node=$node.Source;compiler=$compiler;ready=$true}|ConvertTo-Json;return}
if(-not $InstallRoot){$InstallRoot=Join-Path $env:LOCALAPPDATA 'CodexWallpapers/app'}
if(-not $ShortcutRoot){$ShortcutRoot=[Environment]::GetFolderPath('Programs')}
if(Test-Path -LiteralPath $InstallRoot){throw 'Install directory already exists. Preserve it and follow docs/UPDATES.md.'}
$linkPath=Join-Path $ShortcutRoot 'Codex Wallpapers.lnk'
if(Test-Path -LiteralPath $linkPath){throw 'Shortcut already exists; no existing shortcut was overwritten.'}
New-Item -ItemType Directory -Path $InstallRoot -Force|Out-Null
foreach($folder in @('src','windows')){Copy-Item -LiteralPath (Join-Path $repo $folder) -Destination $InstallRoot -Recurse}
Copy-Item -LiteralPath (Join-Path $repo 'compatibility.json') -Destination $InstallRoot
$bin=Join-Path $InstallRoot 'windows'
Copy-Item -LiteralPath $icon -Destination (Join-Path $bin 'official.ico')
$app.AppId|Set-Content (Join-Path $bin 'app-id.txt') -Encoding UTF8
& $compiler /nologo /target:winexe ('/out:'+(Join-Path $bin 'CodexWallpapers.exe')) ('/win32icon:'+(Join-Path $bin 'official.ico')) (Join-Path $bin 'Launcher.cs')
if($LASTEXITCODE -ne 0){throw 'Launcher compilation failed; no shortcut was created.'}
New-Item -ItemType Directory -Path $ShortcutRoot -Force|Out-Null
$shell=New-Object -ComObject WScript.Shell;$link=$shell.CreateShortcut($linkPath)
$link.TargetPath=Join-Path $bin 'CodexWallpapers.exe';$link.WorkingDirectory=$bin;$link.IconLocation=(Join-Path $bin 'official.ico')+',0';$link.Description='Codex with optional local wallpapers';$link.Save()
Add-Type -Path (Join-Path $bin 'ShortcutIdentity.cs');[WallpaperShortcut]::Set($linkPath,$app.AppId)
@{schema=1;root=[IO.Path]::GetFullPath($InstallRoot);shortcut=$linkPath;appId=$app.AppId;version=$app.Version}|ConvertTo-Json|Set-Content (Join-Path $InstallRoot 'installation.json') -Encoding UTF8
Write-Output "Installed: $linkPath. Close Codex normally and open this shortcut."
