/** @format */

import fs from "fs";
import YAML from "js-yaml";
import fetch from "node-fetch";
import "dotenv/config";

import path from "path";

async function fetchExistingMetadata(
  hasuraUrl: string,
  hasuraAdminSecret: string
) {
  const response = await fetch(`${hasuraUrl}/v1/metadata`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Hasura-Admin-Secret": hasuraAdminSecret,
    },
    body: JSON.stringify({ type: "export_metadata", args: {} }),
  });

  if (!response.ok) {
    throw new Error(`Error fetching metadata: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

export async function exportMetadataToYAML(
  hasuraUrl: string,
  hasuraAdminSecret: string) {
  try {
    const metadata = await fetchExistingMetadata(hasuraUrl, hasuraAdminSecret);
    const yamlData = YAML.dump(metadata);
    const dumpFolderPath = path.join(__dirname, "dump");

    // Check if the 'dump' folder exists, create it if it doesn't
    if (!fs.existsSync(dumpFolderPath)) {
      fs.mkdirSync(dumpFolderPath);
    }

    // Write metadata to 'dump/metadata.yml'
    const metadataFilePath = path.join(dumpFolderPath, "metadata.yml");
    fs.writeFileSync(metadataFilePath, yamlData, "utf8");
    console.log('Metadata successfully exported to dump/metadata.yml');
  } catch (error) {
    console.error("Error fetching or exporting metadata:", error);
  }
}

export async function applyMetadata(
  hasuraUrl: string,
  hasuraAdminSecret: string
) {
  const metadataFilePath = path.join(__dirname, "matadata.yml");

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

    const response = await fetch(`${hasuraUrl}/v1/metadata`, {
      method: "POST",
      headers,
      body: JSON.stringify(permissionQuery),
    });

    const responseData = await response.json();
    if (response.ok) {
      console.log("Metadata applied successfully:", responseData);
    } else {
      console.error("Failed to apply metadata:", response.status, responseData);
    }
  } catch (error) {
    console.error("Error applying metadata:", error.message);
  }
}
