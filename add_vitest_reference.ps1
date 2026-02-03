# PowerShell script to add vitest reference to test files
$testFiles = Get-ChildItem -Path "tests" -Filter "*.test.ts" -Recurse

foreach ($file in $testFiles) {
    $content = Get-Content $file.FullName -Raw
    
    # Check if reference already exists
    if ($content -match "/// <reference types=\"vitest\" />") {
        Write-Host "Reference already exists in $($file.FullName)"
        continue
    }
    
    # Add reference after the first comment block
    $lines = Get-Content $file.FullName
    $newLines = @()
    $added = $false
    
    foreach ($line in $lines) {
        $newLines += $line
        
        # Add reference after the first comment block ends
        if (-not $added -and $line -match "^$" -and $newLines[0] -match "^/\*\*") {
            $newLines += "/// <reference types=\"vitest\" />"
            $newLines += ""
            $added = $true
        }
    }
    
    # If we didn't add it (no comment block), add at the beginning
    if (-not $added) {
        $newLines = @("/// <reference types=\"vitest\" />", "") + $newLines
    }
    
    $newContent = $newLines -join "`n"
    
    if ($newContent -ne $content) {
        Write-Host "Adding reference to $($file.FullName)"
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
    }
}

Write-Host "Done adding vitest references to $($testFiles.Count) test files"