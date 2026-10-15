$ErrorActionPreference='Stop'
$originalPath=$env:PATH
try {
    # Reproduce an Explorer/Task Scheduler PATH with no Node installation listed.
    $env:PATH="$env:WINDIR\System32;$env:WINDIR;$env:WINDIR\System32\WindowsPowerShell\v1.0"
    . "$PSScriptRoot/../windows/node-runtime.ps1"
    $runtime=Initialize-CWNode
    if(-not (Test-Path -LiteralPath $runtime.Source)){throw 'Runtime was not resolved'}
    $version=& $runtime.Source --version
    if($LASTEXITCODE -ne 0){throw 'Resolved runtime failed to execute'}
    Write-Output "PASS: minimal Windows PATH resolves Node $version; no Codex process was launched."
} finally {$env:PATH=$originalPath}
