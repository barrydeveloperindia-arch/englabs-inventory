
# Dynamic Test Runner for ENGLABS
param(
    [string]$Target = ""
)
$vitest = ".\node_modules\vitest\vitest.mjs"
if ($Target) {
    node $vitest run $Target | Out-File -FilePath "test_run_results.log" -Encoding utf8
} else {
    node $vitest run | Out-File -FilePath "test_run_results.log" -Encoding utf8
}
