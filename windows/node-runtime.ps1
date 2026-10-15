function Initialize-CWNode {
    # Explorer and Task Scheduler may not inherit the agent terminal's PATH.
    $command = Get-Command node.exe -ErrorAction SilentlyContinue
    if (-not $command) {
        $candidates = @(
            (Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'),
            (Join-Path $env:ProgramFiles 'nodejs/node.exe')
        )
        $runtime = $candidates | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1
        if (-not $runtime) { throw 'Node.js 22 or newer is required. Install Node or open Codex once to provision its runtime.' }
        $env:PATH = (Split-Path $runtime -Parent) + ';' + $env:PATH
        $command = Get-Command node.exe -ErrorAction Stop
    }
    $version = & $command.Source --version
    if ($LASTEXITCODE -ne 0 -or $version -notmatch '^v(\d+)\.' -or [int]$Matches[1] -lt 22) { throw 'Node.js 22 or newer is required.' }
    return $command
}
