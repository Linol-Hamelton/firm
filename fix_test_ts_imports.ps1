# Fix test imports - remove .ts extensions

$files = @(
    "tests/unit/core/array.test.ts",
    "tests/unit/core/boolean.test.ts",
    "tests/unit/core/compiler.test.ts",
    "tests/unit/core/number.test.ts",
    "tests/unit/core/object.test.ts",
    "tests/unit/core/property-based.test.ts",
    "tests/unit/core/record.test.ts",
    "tests/unit/core/security.test.ts",
    "tests/unit/core/special.test.ts",
    "tests/unit/core/string.test.ts",
    "tests/unit/core/union.test.ts",
    "tests/unit/infrastructure/auto-fix.test.ts",
    "tests/unit/infrastructure/smart-caching.test.ts",
    "tests/unit/integrations/express.test.ts",
    "tests/unit/integrations/openapi.test.ts",
    "tests/unit/integrations/prisma.test.ts",
    "tests/unit/integrations/react-hook-form.test.ts",
    "tests/unit/integrations/trpc.test.ts",
    "tests/unit/integrations/typeorm.test.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $original = $content

        # Remove .ts extensions from imports
        $content = $content -replace "from\s+'([^']+)\.ts'", "from '$1'"
        $content = $content -replace 'from\s+"([^"]+)\.ts"', 'from "$1"'

        # Only write if changed
        if ($content -ne $original) {
            Set-Content -Path $file -Value $content -NoNewline
            Write-Host "Fixed: $file"
        }
    }
}

Write-Host "Done!"
