# PowerShell script to fix imports in test files
$testFiles = Get-ChildItem tests -Recurse -Filter *.test.ts

foreach ($file in $testFiles) {
    $content = Get-Content $file.FullName -Raw
    
    # Replace imports from '../../../src/index' to '../../../src/index.ts'
    $newContent = $content -replace "from '../../../src/index'", "from '../../../src/index.ts'"
    $newContent = $newContent -replace "from '../../../src/index.js'", "from '../../../src/index.ts'"
    
    # Remove imports of describe, it, expect from 'vitest' (since globals: true)
    $newContent = $newContent -replace "import { describe, it, expect } from 'vitest';`r?`n", ""
    $newContent = $newContent -replace "import { describe, it, expect } from 'vitest'`r?`n", ""
    
    if ($newContent -ne $content) {
        Write-Host "Fixing $($file.FullName)"
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
    }
}

Write-Host "Done fixing imports."