export class Spinner {
  private interval: NodeJS.Timeout | null = null;
  private message: string = "";
  private frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  private currentFrame = 0;

  start(message: string) {
    this.message = message;
    this.currentFrame = 0;

    process.stdout.write("\x1b[?25l"); // Hide cursor

    this.interval = setInterval(() => {
      process.stdout.write(
        `\r${this.frames[this.currentFrame]} ${this.message}`
      );
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
    }, 100);
  }

  success(message: string) {
    this.stop();
    console.log(`\r✅ ${message}`);
  }

  error(message: string) {
    this.stop();
    console.log(`\r❌ ${message}`);
  }

  info(message: string) {
    this.stop();
    console.log(`\rℹ️  ${message}`);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    process.stdout.write("\x1b[?25h"); // Show cursor
    process.stdout.write("\r\x1b[K"); // Clear line
  }
}

export const createSpinner = () => new Spinner();
