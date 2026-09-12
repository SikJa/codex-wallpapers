[CmdletBinding()]
param([string]$VerifyEndpoint)
$ErrorActionPreference='Stop'
function Get-CWPackage {
 $package=Get-AppxPackage -Name OpenAI.Codex -ErrorAction Stop | Sort-Object Version -Descending | Select-Object -First 1
 if(-not $package -or $package.SignatureKind -ne 'Store' -or $package.IsDevelopmentMode){throw 'Official Store package unavailable.'}
 $manifest=Get-AppxPackageManifest -Package $package
 $app=@($manifest.Package.Applications.Application | Where-Object {$_.Executable.Replace('/','\') -eq 'app\ChatGPT.exe'})
 if($app.Count -ne 1){throw 'Unsupported application manifest.'}
 $exe=Join-Path $package.InstallLocation 'app/ChatGPT.exe'
 if(-not(Test-Path -LiteralPath $exe)){throw 'Official executable unavailable.'}
 [pscustomobject]@{Version="$($package.Version)";Executable=$exe;Root=$package.InstallLocation;AppId="$($package.PackageFamilyName)!$($app[0].Id)";Family=$package.PackageFamilyName}
}
function Get-CWProcesses($App){
 # Fail closed if process identity cannot be read; never assume app is absent.
 @(Get-CimInstance Win32_Process -Filter "Name='ChatGPT.exe'" -ErrorAction Stop | Where-Object {$_.ExecutablePath -eq $App.Executable})
}
function Test-CWEndpoint($Endpoint,$App){
 if($Endpoint.port -lt 1024 -or $Endpoint.port -gt 65535){throw 'Invalid endpoint port.'}
 $listeners=@(Get-NetTCPConnection -State Listen -LocalPort $Endpoint.port -ErrorAction SilentlyContinue)
 if(-not $listeners.Count){throw 'No local endpoint.'}
 foreach($l in $listeners){
  if($l.LocalAddress -notin @('127.0.0.1','::1')){throw 'Non-loopback endpoint rejected.'}
  $process=Get-CimInstance Win32_Process -Filter "ProcessId=$($l.OwningProcess)" -ErrorAction Stop
  if($process.ExecutablePath -ne $App.Executable){throw 'Endpoint does not belong to this Codex package.'}
 }
 $v=Invoke-RestMethod "http://127.0.0.1:$($Endpoint.port)/json/version" -TimeoutSec 3 -MaximumRedirection 0
 $uri=[Uri]$v.webSocketDebuggerUrl
 if($uri.Host -notin @('127.0.0.1','localhost','[::1]') -or $uri.Port -ne $Endpoint.port -or $uri.AbsolutePath -ne "/devtools/browser/$($Endpoint.browserId)"){throw 'Endpoint identity mismatch.'}
 if($Endpoint.version -ne $App.Version){throw 'Package changed after endpoint creation.'}
 return $true
}
function Start-CWPackage($App,[string]$Arguments=''){
 if(-not ('CWPackageActivation' -as [type])){Add-Type -TypeDefinition @'
using System; using System.Runtime.InteropServices;
public static class CWPackageActivation {
 [ComImport,Guid("2e941141-7f97-4756-ba1d-9decde894a3d"),InterfaceType(ComInterfaceType.InterfaceIsIUnknown)] interface Manager {
  [PreserveSig] int ActivateApplication([MarshalAs(UnmanagedType.LPWStr)] string id,[MarshalAs(UnmanagedType.LPWStr)] string args,uint options,out uint pid);
 }
 [ComImport,Guid("45ba127d-10a8-46ea-8ab7-56ea9078943c")] class ActivationManager {}
 public static void Open(string id,string args){var m=(Manager)new ActivationManager();try{uint pid;Marshal.ThrowExceptionForHR(m.ActivateApplication(id,args,0,out pid));}finally{Marshal.ReleaseComObject(m);}}
}
'@}
 [CWPackageActivation]::Open($App.AppId,$Arguments)
}
if($VerifyEndpoint){$ep=Get-Content -LiteralPath $VerifyEndpoint -Raw|ConvertFrom-Json;Test-CWEndpoint $ep (Get-CWPackage)|Out-Null}
