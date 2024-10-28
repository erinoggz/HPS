#!/usr/bin/env ts-node

import { program } from "./utils/cli";

program
.action(
    async (
      realm: string,
      clientId: string,
      options: { port?: number}
    ) => {
      const { port } = options;
      try {
 
       console.log("Hello Word")
       console.log({realm})
       console.log({clientId})
       console.log({port})
       
      } catch (e) {
        process.exit(1);
      }
    }
  );

/* Handle invalid command. */
program.on("command:*", () => {
  console.error(`Invalid command: ${program.args.join(" ")}`);
  program.help();
  process.exit(1);
});

/*This allows us to process and extract data from the command line arguments passed to program.*/
program.parse(process.argv);
