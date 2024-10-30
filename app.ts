#!/usr/bin/env ts-node

import { program } from "./utils/cli";
import { applyMetadata, exportMetadataToYAML } from "./utils/metadata";

program.action(async (options: { endpoint: string; secret: string }) => {
  try {
    const { endpoint, secret } = options;
    // await exportMetadataToYAML(endpoint, secret)    
    await applyMetadata(endpoint, secret);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
});

/* Handle invalid command. */
program.on("command:*", () => {
  console.error(`Invalid command: ${program.args.join(" ")}`);
  program.help();
  process.exit(1);
});

/*This allows us to process and extract data from the command line arguments passed to program.*/
program.parse(process.argv);
