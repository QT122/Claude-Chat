# Update Desktop shortcut for Claude Chat
# Run this after moving the project or after installing a new version

$desktop = [Environment]::GetFolderPath('Desktop')
$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$exePath = Join-Path $projectDir "dist\win-unpacked\Claude Chat.exe"

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut((Join-Path $desktop "Claude Chat.lnk"))
$shortcut.TargetPath = $exePath
$shortcut.WorkingDirectory = (Join-Path $projectDir "dist\win-unpacked")
$shortcut.Save()
Write-Host "Shortcut updated to $($shortcut.TargetPath)"
