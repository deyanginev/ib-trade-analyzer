import { CommandProcessor } from "./commandProcessor";
import _ from "lodash";
import fs from "fs";
import parse from "csv-parse/lib/sync";
import moment from "moment";
import { IConsole } from "../console/console";

export class MainCommandProcessor extends CommandProcessor {
  private childProcessors: CommandProcessor[] = [];

  constructor(console: IConsole) {
    super(console);
  }

  protected getChildProcessors(): CommandProcessor[] {
    return this.childProcessors;
  }

  protected get Prototype(): any {
    return MainCommandProcessor.prototype;
  }

  protected getHelp(command: string): string {
    switch (command) {
      case "load":
        return "<file-path> loads the specified file contents";
      case "exit":
        return "terminates the program";
      case "list":
        return "lists the currently loaded datasets";
      default:
        return "";
    }
  }

  public exitCommand() {
    process.exit(1);
  }

  public listCommand() {
    this.consoleInterface.writeLine("Available datasets:");
    for (const childProcessor of this.childProcessors) {
      this.consoleInterface.writeLine(`* ${childProcessor.commandToken} - ${childProcessor.processorDescription}`);
    }
  }

  public loadCommand(file: string) {
    this.childProcessors = this.generateChildProcessors(file);
    for (const processor of this.childProcessors) {
      this.consoleInterface.write(`Loaded dataset: ${processor.commandToken}`);
    }
  }

  private loadReportMetadata(): { [key: string]: any } {
    const files = fs.readdirSync(`${__dirname}`);
    return _(files)
      .filter(
        (fileName) =>
          !_.isEmpty(fileName.trim()) &&
          fileName.endsWith("CommandProcessor.js")
      )
      .map((fileName) => {
        const reportModule = require(`${__dirname}\\${fileName}`);
        if (!_.isEmpty(reportModule.REPORT_TOKEN)) {
          return {
            key: reportModule.REPORT_TOKEN,
            type: reportModule.default,
          };
        }
      })
      .compact()
      .keyBy("key")
      .mapValues((meta) => meta.type)
      .value();
  }

  private generateChildProcessors(file: string): CommandProcessor[] {
    const reportMetas = this.loadReportMetadata();
    const input = fs.readFileSync(file, {
      encoding: "utf-8",
    });

    const lines = input.split("\n");

    const categories: any = _(lines)
      .filter((line) => !_.isEmpty(line))
      .map((line) => {
        const trimmedLine = line.trim();
        const indexOfFirstDelimiter = trimmedLine.indexOf(",");
        return {
          category: trimmedLine.trim().substr(0, indexOfFirstDelimiter),
          content: trimmedLine.substr(indexOfFirstDelimiter + 1),
        };
      })
      .groupBy((lineInfo) => lineInfo.category)
      .mapValues((categoryInfos) =>
        _.map(categoryInfos, (cInfo) => cInfo.content)
      )
      .value();

    return _(categories)
      .map<CommandProcessor | undefined>((content: any, key: string):
        | CommandProcessor
        | undefined => {
        const statement = content.join("\n");
        try {
          const parsedCsv = parse(statement, {
            delimiter: ",",
            columns: (header) =>
              _.map(header, (column: string) =>
                column
                  .replace(/\d|&|\/| |\./gi, "")
                  .replace("%", "perc")
                  .toLowerCase()
              ),
            skipEmptyLines: true,
            cast: (value, context) => {
              if (context.column === "datetime") {
                return moment.utc(value, "YYYY-MM-DD, HH:mm:SS").toDate();
              }

              return value;
            },
          });
          const lowerCaseKey = key.toLowerCase();
          if (reportMetas[lowerCaseKey]) {
            return new reportMetas[lowerCaseKey](this.consoleInterface, parsedCsv);
          }
        } catch (e) {
          // We skip out records that are not structured
          // following the pattern:
          // Category (Activity Statement, Trades, MTM, etc)
          //    |
          //    -> CSV Table with records for the current activity
        }
      })
      .compact()
      .value();
  }
}
