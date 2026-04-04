import fs from 'fs';
import path from 'path';

/**
 * Smart Test Coverage Analyzer
 * Formula: Coverage = (test_cases / total_logic_paths) * 100
 */
function analyzeCoverage() {
    console.log('📊 Initializing Smart Coverage Analysis...');

    let totalLogicPaths = 0;
    let totalTestCases = 0;

    const sourceDirs = ['src', 'lib', 'components'];
    const testDirs = ['tests'];

    // 1. Estimate Logic Paths (Cyclomatic-ish Complexity Scan)
    sourceDirs.forEach(dir => {
        const fullPath = path.resolve(process.cwd(), dir);
        if (fs.existsSync(fullPath)) {
            const files = getAllFiles(fullPath, ['.ts', '.tsx']);
            files.forEach(file => {
                const content = fs.readFileSync(file, 'utf8');
                // Regex for decision points: if, else if, case, ternary, catch
                const matches = content.match(/if\s*\(|case\s+.*:|catch\s*\(|\?\s*.*:/g) || [];
                totalLogicPaths += (matches.length + 1); // +1 for the base path
            });
        }
    });

    // 2. Count Test Cases
    testDirs.forEach(dir => {
        const fullPath = path.resolve(process.cwd(), dir);
        if (fs.existsSync(fullPath)) {
            const files = getAllFiles(fullPath, ['.test.ts', '.test.tsx', '.spec.ts']);
            files.forEach(file => {
                const content = fs.readFileSync(file, 'utf8');
                // Count 'test(' or 'it('
                const matches = content.match(/test\(|it\(/g) || [];
                totalTestCases += matches.length;
            });
        }
    });

    const coverage = (totalTestCases / totalLogicPaths) * 100;

    console.log(`--- COVERAGE ANALYSIS RESULTS ---`);
    console.log(`Logical Decision Paths: ${totalLogicPaths}`);
    console.log(`Validated Test Cases: ${totalTestCases}`);
    console.log(`Logic-Path Coverage: ${coverage.toFixed(2)}%`);
    console.log(`---------------------------------`);

    if (coverage < 60) {
        console.warn('⚠️ WARNING: Test suite is weak. Logic coverage is below threshold.');
    }
}

function getAllFiles(dirPath, extensions) {
    let results = [];
    const list = fs.readdirSync(dirPath);
    list.forEach(file => {
        file = path.join(dirPath, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(getAllFiles(file, extensions));
        } else {
            if (extensions.some(ext => file.endsWith(ext))) {
                results.push(file);
            }
        }
    });
    return results;
}

analyzeCoverage();
