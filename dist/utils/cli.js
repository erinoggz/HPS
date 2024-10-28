"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.program = void 0;
const commander_1 = require("commander");
const figlet_1 = __importDefault(require("figlet"));
const package_json_1 = __importDefault(require("../package.json"));
exports.program = new commander_1.Command();
const appVersion = package_json_1.default.version;
console.log(figlet_1.default.textSync("Revkeep Hasura Connect"));
/* This set the name,version and the description for the CLI tool,which can be display using the --version and --help options */
exports.program
    .name("Revkeep Hasura Connect")
    .version(appVersion, "-v, --version", "output the current version")
    .description("Revkeep Hasura Connect is use to confirm hasura keycloak connection.");
exports.program
    .option("-c, --connect", "run hasura keycloak connection ")
    .option("-p, --port <port>", "keycloak server port")
    .argument("<realm>", "output keycloak realm")
    .argument("<clientId>", "keycloak client id");
// .requiredOption(
//   "-c, --connect <realm>",
//   "connect keycloak realm and clientId and create hasura connection"
// )
//# sourceMappingURL=cli.js.map