export class Spinner {
  private interval: NodeJS.Timeout | null = null;
  private message: string = "";
  private frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  private currentFrame = 0;
  private lastOutputLength = 0; // Track last rendered width to overwrite remnants
  private readonly isTTY: boolean = !!process.stdout.isTTY;

  start(message: string) {
    // Stop any existing spinner first
    this.stop();

    this.message = message;
    this.currentFrame = 0;
    this.lastOutputLength = 0;

    if (!this.isTTY) {
      // In non-TTY environments, just log the message once
      console.log(this.message);
      return;
    }

    process.stdout.write("\x1b[?25l"); // Hide cursor

    this.interval = setInterval(() => {
      // Compose a single-line render that never wraps the terminal width
      const columns =
        typeof process.stdout.columns === "number"
          ? process.stdout.columns
          : 80;
      const frame = this.frames[this.currentFrame];
      const baseText = `${frame} ${this.message}`;
      const maxWidth = Math.max(0, columns - 1);
      let renderText =
        baseText.length > maxWidth ? baseText.slice(0, maxWidth) : baseText;
      // Pad with spaces if the new render is shorter than the previous to fully overwrite
      if (this.lastOutputLength > renderText.length) {
        renderText =
          renderText + " ".repeat(this.lastOutputLength - renderText.length);
      }
      process.stdout.write(`\r${renderText}`);
      this.lastOutputLength = renderText.length;
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
    }, 100);
  }

  success(message: string) {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    // Move to start, clear entire line (direction 0 = entire line), show cursor
    process.stdout.cursorTo(0);
    process.stdout.clearLine(0);
    process.stdout.write("\x1b[?25h"); // Show cursor
    process.stdout.write(`\x1b[32m✓\x1b[0m ${message}\n`);
    this.lastOutputLength = 0;
  }

  error(message: string) {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    // Move to start, clear entire line (direction 0 = entire line), show cursor
    process.stdout.cursorTo(0);
    process.stdout.clearLine(0);
    process.stdout.write("\x1b[?25h"); // Show cursor
    process.stdout.write(`\x1b[31m✗\x1b[0m ${message}\n`);
    this.lastOutputLength = 0;
  }

  info(message: string) {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    // Move to start, clear entire line (direction 0 = entire line), show cursor
    process.stdout.cursorTo(0);
    process.stdout.clearLine(0);
    process.stdout.write("\x1b[?25h"); // Show cursor
    process.stdout.write(`\x1b[34mℹ\x1b[0m ${message}\n`);
    this.lastOutputLength = 0;
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    // Clear the current line completely
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    // Show cursor
    process.stdout.write("\x1b[?25h");
    this.lastOutputLength = 0;
  }
}

export const createSpinner = () => new Spinner();
