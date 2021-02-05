import readline from "readline";
import { MainCommandProcessor } from "../src/commands/mainCommandProcessor";
import { DefaultConsole } from "../src/console/console";

const consoleInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'ibanalyzer> '
});

const defaultConsole = new DefaultConsole(consoleInterface);
const mainCommandProcessor = new MainCommandProcessor(defaultConsole);

defaultConsole.write("Welcome to IB Activity Analyzer");
defaultConsole.write("Current version: 0.0.1");
mainCommandProcessor.start();
