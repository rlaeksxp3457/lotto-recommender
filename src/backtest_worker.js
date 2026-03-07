/**
 * 백테스트 Worker 스레드
 * - 로또 / 연금복권 백테스트를 메인 스레드 블로킹 없이 실행
 */

const { parentPort, workerData } = require("worker_threads");

const type = workerData.type; // "lotto" | "pension"

if (type === "lotto") {
  const { runBacktest } = require("./analyzer");
  const results = runBacktest((pct) => {
    parentPort.postMessage({ event: "progress", type: "lotto", pct });
  });
  parentPort.postMessage({ event: "done", type: "lotto", results });
} else if (type === "pension") {
  const { runPensionBacktest } = require("./pension_analyzer");
  const results = runPensionBacktest((pct) => {
    parentPort.postMessage({ event: "progress", type: "pension", pct });
  });
  parentPort.postMessage({ event: "done", type: "pension", results });
}
