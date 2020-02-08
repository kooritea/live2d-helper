export class Logger {
  static canLog: boolean = true;
  static canWarn: boolean = true;
  static canError: boolean = true;

  static init(
    canLog: boolean = true,
    canWarn: boolean = true,
    canError: boolean = true
  ) {
    this.canLog = canLog;
    this.canWarn = canWarn;
    this.canError = canError;
  }

  static log(message: string, isDebug: boolean = false) {
    if (Logger.canLog) {
      console.log(`[live2d-helper] ${message}`);
    }
  }
  static warn(message: string, isDebug: boolean = false) {
    if (Logger.canWarn) {
      console.warn(`[live2d-helper] ${message}`);
    }
  }
  static error(message: string, isDebug: boolean = false) {
    if (Logger.canError) {
      console.error(`[live2d-helper] ${message}`);
    }
  }
}
