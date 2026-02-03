# PowerShell script to fix imports in test files
$testFiles = Get-ChildItem tests -Recurse -Filter *.test.ts

foreach ($file in $testFiles) {
    $content = Get-Content $file.FullName -Raw
    
    # Replace imports from '../../../src/index' to '../../../src/index.ts'
    $newContent = $content -replace "from '../../../src/index'", "from '../../../src/index.ts'"
    $newContent = $newContent -replace "from '../../../src/index.js'", "from '../../../src/index.ts'"
    
    # Add import of describe, it, expect from 'vitest' if missing
    if ($newContent -match 'import.*from.*vitest') {
        # Already has import, keep it
    } else {
        # Add import at the top after any comments
        $lines = $newContent -split "`n"
        $importAdded = $false
        $newLines = @()
        foreach ($line in $lines) {
            if (-not $importAdded -and $line -match '^\s*import') {
                $newLines += "import { describe, it, expect } from 'vitest';"
                $importAdded = $true
            }
            $newLines += $line
        }
        if (-not $importAdded) {
            # No import found, add at the beginning
            $newLines = @("import { describe, it, expect } from 'vitest';") + $newLines
        }
        $newContent = $newLines -join "`n"
    }
    
    if ($newContent -ne $content) {
        Write-Host "Fixing $($file.FullName)"
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
    }
}

Write-Host "Done fixing imports."