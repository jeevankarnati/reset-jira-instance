export class Spinner {
  private interval: NodeJS.Timeout | null = null;
  private message: string = "";
  private frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  private currentFrame = 0;

  start(message: string) {
    // Stop any existing spinner first
    this.stop();

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
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    process.stdout.write("\r\x1b[K"); // Clear the line
    process.stdout.write("\x1b[?25h"); // Show cursor
    console.log(`\x1b[32m✓\x1b[0m ${message}`);
  }

  error(message: string) {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    process.stdout.write("\r\x1b[K"); // Clear the line
    process.stdout.write("\x1b[?25h"); // Show cursor
    console.log(`\x1b[31m✗\x1b[0m ${message}`);
  }

  info(message: string) {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    process.stdout.write("\r\x1b[K"); // Clear the line
    process.stdout.write("\x1b[?25h"); // Show cursor
    console.log(`\x1b[34mℹ\x1b[0m ${message}`);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    // Clear the current line completely
    process.stdout.write("\r\x1b[K");
    // Show cursor
    process.stdout.write("\x1b[?25h");
  }
}

export const createSpinner = () => new Spinner();
