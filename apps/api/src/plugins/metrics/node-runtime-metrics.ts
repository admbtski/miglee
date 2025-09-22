import opentelemetry from '@opentelemetry/api';
import { monitorEventLoopDelay } from 'node:perf_hooks';

const meter = opentelemetry.metrics.getMeter('runtime');

// event-loop lag (średnia z okna)
const elHistogram = monitorEventLoopDelay({ resolution: 20 });
elHistogram.enable();

const evloopLag = meter.createObservableGauge('nodejs_eventloop_lag_seconds', {
  description: 'Mean event-loop delay over the last interval',
});
const evloopLagMax = meter.createObservableGauge(
  'nodejs_eventloop_lag_max_seconds',
  {
    description: 'Max event-loop delay over the last interval',
  }
);

// pamięć
const heapUsed = meter.createObservableGauge('nodejs_heap_used_bytes');
const heapTotal = meter.createObservableGauge('nodejs_heap_total_bytes');
const rssBytes = meter.createObservableGauge('process_resident_memory_bytes');

// uptime i CPU
const uptime = meter.createObservableGauge('process_uptime_seconds');
const cpuTotal = meter.createObservableCounter('process_cpu_seconds_total');

let lastCpuUser = 0;
let lastCpuSys = 0;

// rejestracja callbacków
evloopLag.addCallback((obs) => {
  // mean/max w ns → s
  obs.observe(elHistogram.mean / 1e9);
});
evloopLagMax.addCallback((obs) => {
  obs.observe(elHistogram.max / 1e9);
});

heapUsed.addCallback((obs) => obs.observe(process.memoryUsage().heapUsed));
heapTotal.addCallback((obs) => obs.observe(process.memoryUsage().heapTotal));
rssBytes.addCallback((obs) => obs.observe(process.memoryUsage().rss));

uptime.addCallback((obs) => obs.observe(process.uptime()));

cpuTotal.addCallback((obs) => {
  const { user, system } = process.cpuUsage(); // µs since process start
  // monotoniczny całkowity czas CPU
  const incUser = Math.max(0, user - lastCpuUser);
  const incSys = Math.max(0, system - lastCpuSys);
  lastCpuUser = user;
  lastCpuSys = system;
  // dodaj przyrost w sekundach
  obs.observe((incUser + incSys) / 1e6);
});
