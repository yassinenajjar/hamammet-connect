$ErrorActionPreference = 'Stop'

$backendRoot = $PSScriptRoot
$uploadTempDirectory = Join-Path $backendRoot 'storage/framework/uploads'
$publicDirectory = Join-Path $backendRoot 'public'
$router = Join-Path $backendRoot 'vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php'
$php = (Get-Command php -ErrorAction Stop).Source

New-Item -ItemType Directory -Path $uploadTempDirectory -Force | Out-Null

Push-Location $publicDirectory
try {
    & $php `
        -d "upload_tmp_dir=$uploadTempDirectory" `
        -d 'upload_max_filesize=20M' `
        -d 'post_max_size=110M' `
        -S '127.0.0.1:8000' `
        $router
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}
