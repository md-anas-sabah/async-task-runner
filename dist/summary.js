import { TimeoutError } from './types.js';
export function generateExecutionSummary(results, startTime, endTime) {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const timedOut = results.filter(r => r.timedOut);
    const totalRetries = results.reduce((sum, r) => sum + (r.retryHistory?.length || 0), 0);
    const durations = results
        .map(r => r.duration)
        .filter((d) => d !== undefined);
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    const averageDuration = durations.length > 0 ? totalDuration / durations.length : 0;
    const errors = aggregateErrors(failed);
    return {
        success: successful.length,
        failed: failed.length,
        timedOut: timedOut.length,
        retries: totalRetries,
        totalDuration,
        averageDuration,
        results,
        errors,
        startTime,
        endTime,
        executionTime: endTime.getTime() - startTime.getTime()
    };
}
function aggregateErrors(failedResults) {
    const errorMap = new Map();
    failedResults.forEach(result => {
        if (!result.error)
            return;
        const isTimeout = result.error instanceof TimeoutError || result.timedOut;
        const type = isTimeout ? 'timeout' : 'error';
        const message = result.error.message;
        const key = `${type}:${message}`;
        if (!errorMap.has(key)) {
            errorMap.set(key, {
                type,
                message,
                count: 0,
                taskIndexes: [],
                timestamps: []
            });
        }
        const errorData = errorMap.get(key);
        errorData.count++;
        errorData.taskIndexes.push(result.taskIndex);
        errorData.timestamps.push(new Date());
        if (result.retryHistory) {
            result.retryHistory.forEach(retry => {
                const retryIsTimeout = retry.error instanceof TimeoutError || retry.timedOut;
                const retryType = retryIsTimeout ? 'timeout' : 'error';
                const retryMessage = retry.error.message;
                const retryKey = `${retryType}:${retryMessage}`;
                if (!errorMap.has(retryKey)) {
                    errorMap.set(retryKey, {
                        type: retryType,
                        message: retryMessage,
                        count: 0,
                        taskIndexes: [],
                        timestamps: []
                    });
                }
                const retryErrorData = errorMap.get(retryKey);
                retryErrorData.count++;
                if (!retryErrorData.taskIndexes.includes(result.taskIndex)) {
                    retryErrorData.taskIndexes.push(result.taskIndex);
                }
                retryErrorData.timestamps.push(retry.timestamp);
            });
        }
    });
    return Array.from(errorMap.values()).map(errorData => ({
        type: errorData.type,
        message: errorData.message,
        count: errorData.count,
        taskIndexes: errorData.taskIndexes.sort((a, b) => a - b),
        firstOccurrence: new Date(Math.min(...errorData.timestamps.map(t => t.getTime()))),
        lastOccurrence: new Date(Math.max(...errorData.timestamps.map(t => t.getTime())))
    })).sort((a, b) => b.count - a.count);
}
export function formatSummary(summary) {
    const lines = [];
    lines.push('📊 Task Execution Summary');
    lines.push('='.repeat(50));
    lines.push('');
    lines.push('📈 Results:');
    lines.push(`   ✅ Successful: ${summary.success}`);
    lines.push(`   ❌ Failed: ${summary.failed}`);
    lines.push(`   ⏰ Timed out: ${summary.timedOut}`);
    lines.push(`   🔄 Total retries: ${summary.retries}`);
    lines.push('');
    lines.push('⚡ Performance:');
    lines.push(`   📊 Total duration: ${summary.totalDuration.toFixed(2)}ms`);
    lines.push(`   📊 Average duration: ${summary.averageDuration.toFixed(2)}ms`);
    lines.push(`   ⏱️  Execution time: ${summary.executionTime}ms`);
    lines.push(`   🕐 Started: ${summary.startTime.toISOString()}`);
    lines.push(`   🕐 Ended: ${summary.endTime.toISOString()}`);
    lines.push('');
    if (summary.errors.length > 0) {
        lines.push('🚨 Error Breakdown:');
        summary.errors.forEach((error, index) => {
            const icon = error.type === 'timeout' ? '⏰' : '❌';
            lines.push(`   ${icon} ${error.message}`);
            lines.push(`      Count: ${error.count}`);
            lines.push(`      Tasks: [${error.taskIndexes.join(', ')}]`);
            lines.push(`      First: ${error.firstOccurrence.toISOString()}`);
            if (error.firstOccurrence.getTime() !== error.lastOccurrence.getTime()) {
                lines.push(`      Last: ${error.lastOccurrence.toISOString()}`);
            }
            if (index < summary.errors.length - 1) {
                lines.push('');
            }
        });
        lines.push('');
    }
    const total = summary.success + summary.failed;
    const successRate = total > 0 ? (summary.success / total * 100).toFixed(1) : '0.0';
    lines.push(`🎯 Success Rate: ${successRate}% (${summary.success}/${total})`);
    return lines.join('\n');
}
//# sourceMappingURL=summary.js.map