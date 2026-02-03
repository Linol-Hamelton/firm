# Fix lint errors - prefix unused variables with underscore

$files = @(
    "src\infrastructure\auto-detection\auto-config.ts",
    "src\infrastructure\auto-detection\framework-detector.ts",
    "src\infrastructure\caching\cache-manager.ts",
    "src\infrastructure\wasm\index.ts",
    "src\integrations\angular\index.ts",
    "src\integrations\fastify\index.ts",
    "src\integrations\koa\index.ts",
    "src\integrations\nestjs\index.ts",
    "src\integrations\next\index.ts",
    "src\integrations\react-hook-form\index.ts",
    "src\integrations\svelte\index.ts",
    "src\integrations\vue\index.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $original = $content

        # Replace unused catch error variables
        $content = $content -replace '\} catch \(error\) \{', '} catch {'

        # Replace unused function parameters
        $content = $content -replace '([,\(])(\s*)(devDeps|stats|multithreaded|memoryPages|optimizationLevel|simd|schema|reply|context|resolverOptions|className|error|options)(\s*):', '$1$2_$3$4:'

        # Replace unused type parameters
        $content = $content -replace '<T>([^{]*\{)', '<_T>$1'

        # Only write if changed
        if ($content -ne $original) {
            Set-Content -Path $file -Value $content -NoNewline
            Write-Host "Fixed: $file"
        }
    }
}

Write-Host "Done!"
