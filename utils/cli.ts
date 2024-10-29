import { Command } from "commander";
import figlet from "figlet";

import packageJson from '../package.json';

export const program = new Command();

const appVersion = packageJson.version;

console.log(figlet.textSync("Revkeep Hasura Connect"));

/* This sets the name, version, and description for the CLI tool, which can be displayed using the --version and --help options */
program
  .name("Revkeep Hasura Connect")
  .version(appVersion, "-v, --version", "output the current version")
  .description("Revkeep Hasura Connect is used to confirm Hasura connection.");

program
  .option("-e, --endpoint <url>", "Hasura endpoint URL")
  .option("-s, --secret <secret>", "Hasura admin secret");
