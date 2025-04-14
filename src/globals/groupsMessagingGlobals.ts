let gmStop = true;
let gmLogger: (msg: string) => void = console.log;
let gmClearLogger: () => void = () => {};

// Stop signal
export function gmStopSending() {
  gmStop = true;
}

export function gmResetStop() {
  gmStop = false;
}

export function gmIsStopped(): boolean {
  return gmStop;
}

// Logger
export function gmSetLogger(
  loggerFn: (msg: string) => void,
  clearFn?: () => void
) {
  gmLogger = loggerFn;
  if (clearFn) gmClearLogger = clearFn;
}

export function gmLog(): (msg: string) => void {
  return gmLogger;
}

export function gmClearLog(): void {
  gmClearLogger();
}
