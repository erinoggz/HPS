/** @format */

import fs from "fs";
import YAML from "js-yaml";
import fetch from "node-fetch";
import "dotenv/config";

import path from 'path';

export async function applyMetadata(hasuraUrl: string, hasuraAdminSecret: string) {
    const metadataFilePath = path.join(__dirname, 'matadata.yml');

  const headers = {
    "Content-Type": "application/json",
    "X-Hasura-Admin-Secret": hasuraAdminSecret,
  };

  try {
    const raw = fs.readFileSync(metadataFilePath, "utf8");
    const metadata = YAML.load(raw);

    const permissionQuery = {
      type: "replace_metadata",
      args: {
        metadata: metadata,
      },
    };

    const response = await fetch(hasuraUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(permissionQuery),
    });

    const responseData = await response.json();
    if (response.ok) {
      console.log(
        "Metadata applied successfully:",
        responseData
      );
    } else {
      console.error(
        "Failed to apply metadata:",
        response.status,
        responseData
      );
    }
  } catch (error) {
    console.error("Error applying metadata:", error.message);
  }
}
