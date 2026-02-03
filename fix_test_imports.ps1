# Fix .js imports in test files
$testFiles = Get-ChildItem -Path "tests" -Filter "*.ts" -Recurse

foreach ($file in $testFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content

    # Remove .js from imports
    $content = $content -replace "from (['""])(.+?)\.js\1", "from `$1`$2`$1"

    # Only write if changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Fixed: $($file.FullName)"
    }
}

Write-Host "Done!"
