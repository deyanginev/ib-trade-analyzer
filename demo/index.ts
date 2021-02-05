import readline from "readline";
import { MainCommandProcessor } from "../src/commands/mainCommandProcessor";
import { DefaultConsole } from "../src/console/console";

const consoleInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const mainCommandProcessor = new MainCommandProcessor(new DefaultConsole(consoleInterface));

consoleInterface.write("Welcome to IB Activity Analyzer\n");
consoleInterface.write("Current version: 0.0.1\n");
mainCommandProcessor.startListening();
