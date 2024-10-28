import { Command } from "commander";
import figlet from "figlet";

import packageJson from '../package.json';

export const program = new Command();

const appVersion = packageJson.version;

console.log(figlet.textSync("Revkeep Hasura Connect"));

/* This set the name,version and the description for the CLI tool,which can be display using the --version and --help options */
program
  .name("Revkeep Hasura Connect")
  .version(appVersion, "-v, --version", "output the current version")
  .description("Revkeep Hasura Connect is use to confirm hasura keycloak connection.");

program
  .option("-c, --connect", "run hasura keycloak connection ")
  .option("-p, --port <port>", "keycloak server port")

  .argument("<realm>", "output keycloak realm")
  .argument("<clientId>", "keycloak client id")
  // .requiredOption(
  //   "-c, --connect <realm>",
  //   "connect keycloak realm and clientId and create hasura connection"
  // )
