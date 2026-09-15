$ErrorActionPreference='Stop'
. "$PSScriptRoot/../windows/port.ps1"
$held=[Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback,0)
try {
 $held.Server.ExclusiveAddressUse=$true;$held.Start()
 $occupied=$held.LocalEndpoint.Port
 if($null -ne (Get-CWAvailablePort -Preferred $occupied -Count 1)){throw 'Occupied port was selected'}
 $free=Get-CWAvailablePort -Preferred $occupied -Count 20
 if($null -eq $free -or $free -eq $occupied){throw 'No alternate port selected'}
 $probe=[Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback,$free)
 try {$probe.Server.ExclusiveAddressUse=$true;$probe.Start()}finally{$probe.Stop()}
 Write-Output 'PASS: occupied port skipped; alternate port available; exhausted range returns null'
} finally {$held.Stop()}
