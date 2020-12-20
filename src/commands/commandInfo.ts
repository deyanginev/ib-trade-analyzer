import _, { words } from "lodash";

export class CommandInfo {
  private mainCommand: string = "";
  private commandArgs: Array<string> = [];
  constructor(command: string) {
    if (_.isUndefined(command)) {
      throw new Error("Invalid command parameter.");
    }

    const commandWords: string[] = command.trim().split(" ");
    const wordsCount = _.size(commandWords);

    if (_.size(commandWords) === 0) {
      throw new Error("Invalid command.");
    }

    this.mainCommand = commandWords[0];
    if (wordsCount > 1) {
      this.commandArgs = commandWords.splice(1, wordsCount - 1);
    }
  }

  public get Command(): string {
    return this.mainCommand;
  }

  public get Args(): Array<string> {
    return this.commandArgs;
  }

  public get ArgsString(): string {
    return this.commandArgs.join(" ");
  }
}
