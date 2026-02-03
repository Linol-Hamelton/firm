# Fix test imports - remove .ts extensions safely

$files = Get-ChildItem -Path "tests" -Filter "*.test.ts" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $original = $content

    # Remove .ts extension only (not the entire path)
    $content = $content -replace "from\s+'(\.\.\/[^']+)\.ts'", "from '$1'"
    $content = $content -replace 'from\s+"(\.\.\/[^"]+)\.ts"', 'from "$1"'

    # Only write if changed
    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Fixed: $($file.FullName)"
    }
}

Write-Host "Done!"
