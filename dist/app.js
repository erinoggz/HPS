#!/usr/bin/env ts-node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const cli_1 = require("./utils/cli");
cli_1.program
    .action((realm, clientId, options) => __awaiter(void 0, void 0, void 0, function* () {
    const { port } = options;
    try {
        console.log("Hello Word");
        console.log({ realm });
        console.log({ clientId });
        console.log({ port });
    }
    catch (e) {
        // logger.error(e);
        process.exit(1);
    }
}));
/* Handle invalid command. */
cli_1.program.on("command:*", () => {
    console.error(`Invalid command: ${cli_1.program.args.join(" ")}`);
    cli_1.program.help();
    process.exit(1);
});
/*This allows us to process and extract data from the command line arguments passed to program.*/
cli_1.program.parse(process.argv);
//# sourceMappingURL=app.js.map