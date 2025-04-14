let cmStop = true;
let cmLogger: (msg: string) => void = console.log;
let cmClearLogger: () => void = () => {};

// Stop signal
export function cmStopSending() {
  cmStop = true;
}

export function cmResetStop() {
  cmStop = false;
}

export function cmIsStopped(): boolean {
  return cmStop;
}

// Logger
export function cmSetLogger(
  loggerFn: (msg: string) => void,
  clearFn?: () => void
) {
  cmLogger = loggerFn;
  if (clearFn) cmClearLogger = clearFn;
}

export function cmLog(): (msg: string) => void {
  return cmLogger;
}

export function cmClearLog(): void {
  cmClearLogger();
}
