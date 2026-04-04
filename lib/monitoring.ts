/**
 * Performance Monitoring Utility (Root)
 */

let dynamicAvg = 100;
let sampleCount = 0;

// Prometheus-style Metric Storage
const metrics: Record<string, { count: number; sum: number; last: number }> = {};

export function trackPerformance(responseTime: number, operationName: string = 'System Operation') {
    sampleCount++;
    dynamicAvg = (dynamicAvg * (sampleCount - 1) + responseTime) / sampleCount;

    // Update Metrics for Prometheus/Grafana
    if (!metrics[operationName]) {
        metrics[operationName] = { count: 0, sum: 0, last: 0 };
    }
    metrics[operationName].count++;
    metrics[operationName].sum += responseTime;
    metrics[operationName].last = responseTime;

    if (responseTime > dynamicAvg * 2) {
        triggerAlert(`Performance anomaly detected in ${operationName}`, responseTime, dynamicAvg);
    }
}

/**
 * Exposes metrics for Prometheus scraping (Real-time monitoring integration)
 */
export function getPrometheusMetrics(): string {
    let output = '';
    for (const [name, data] of Object.entries(metrics)) {
        const sanitized = name.toLowerCase().replace(/\s+/g, '_');
        output += `# HELP app_${sanitized}_duration_ms Execution time for ${name}\n`;
        output += `# TYPE app_${sanitized}_duration_ms gauge\n`;
        output += `app_${sanitized}_duration_ms ${data.last}\n`;

        output += `# HELP app_${sanitized}_total_count Total executions for ${name}\n`;
        output += `# TYPE app_${sanitized}_total_count counter\n`;
        output += `app_${sanitized}_total_count ${data.count}\n\n`;
    }
    return output;
}

function triggerAlert(message: string, time?: number, avg?: number) {
    const details = (time && avg) ? ` (${time.toFixed(0)}ms, Avg: ${avg.toFixed(0)}ms)` : '';
    console.warn(`[PERFORMANCE] ⚠️ ${message}${details}`);
}
