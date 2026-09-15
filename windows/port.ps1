function Get-CWAvailablePort {
 param([int]$Preferred=9348,[int]$Count=20)
 for($candidate=$Preferred;$candidate -lt $Preferred+$Count;$candidate++){
  $listener=[Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback,$candidate)
  try {$listener.Server.ExclusiveAddressUse=$true;$listener.Start();return $candidate}
  catch [Net.Sockets.SocketException] {continue}
  finally {$listener.Stop()}
 }
 return $null
}
