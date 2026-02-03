# PowerShell script to remove vitest imports from test files
$testFiles = Get-ChildItem -Path "tests" -Filter "*.test.ts" -Recurse

foreach ($file in $testFiles) {
    $content = Get-Content $file.FullName -Raw
    
    # Remove import { describe, it, expect } from 'vitest'
    $newContent = $content -replace "import\s*\{\s*describe\s*,\s*it\s*,\s*expect\s*\}\s*from\s*['\`"]vitest['\`"];?\s*", ""
    
    # Remove import { describe, it } from 'vitest'
    $newContent = $newContent -replace "import\s*\{\s*describe\s*,\s*it\s*\}\s*from\s*['\`"]vitest['\`"];?\s*", ""
    
    # Remove import { expect } from 'vitest'
    $newContent = $newContent -replace "import\s*\{\s*expect\s*\}\s*from\s*['\`"]vitest['\`"];?\s*", ""
    
    # Remove import { describe } from 'vitest'
    $newContent = $newContent -replace "import\s*\{\s*describe\s*\}\s*from\s*['\`"]vitest['\`"];?\s*", ""
    
    # Remove import { it } from 'vitest'
    $newContent = $newContent -replace "import\s*\{\s*it\s*\}\s*from\s*['\`"]vitest['\`"];?\s*", ""
    
    # Remove empty lines at the beginning
    $newContent = $newContent -replace "^\s*\n", ""
    
    if ($newContent -ne $content) {
        Write-Host "Updating $($file.FullName)"
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
    }
}

Write-Host "Done removing vitest imports from $($testFiles.Count) test files"