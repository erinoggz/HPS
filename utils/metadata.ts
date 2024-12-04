/** @format */

import fs from "fs";
import YAML from "js-yaml";
import axios from "axios";
import "dotenv/config";

import path from "path";

async function fetchExistingMetadata(hasuraUrl: string, hasuraAdminSecret: string) {
  try {
    const response = await axios.post(
      `${hasuraUrl}/v1/metadata`,
      { type: "export_metadata", args: {} },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Hasura-Admin-Secret": hasuraAdminSecret,
        },
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(`Error fetching metadata: ${error.message}`);
  }
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
  hasuraAdminSecret: string,
  filePath: string
){  try {
    // Load metadata from YAML file
    const raw = fs.readFileSync(filePath, "utf8");
    const metadata: any = YAML.load(raw);
    // Collect permission queries from YAML metadata
    const permissionQueries = metadata.sources.flatMap((source) =>
      source.tables.flatMap((table) => {
        const actions = ["select_permissions", "insert_permissions", "update_permissions", "delete_permissions"];
        return actions.flatMap((action) => {
          const permissions = table[action];
          if (permissions) {
            return permissions.map((permission) => ({
              type: `create_${action.replace("_permissions", "")}_permission`,
              args: {
                source: source.name,
                table: table.table,
                role: permission.role,
                permission: permission.permission,
              },
            }));
          }
          return [];
        });
      })
    );
    const bulkQuery = {
      type: "bulk",
      args: permissionQueries,
    };

    // Send bulk query using Axios
    const response = await axios.post(`${hasuraUrl}/v1/query`, bulkQuery, {
      headers: {
        "Content-Type": "application/json",
        "X-Hasura-Admin-Secret": hasuraAdminSecret,
      },
    });

    console.log("Permissions applied successfully:", response.data);
  } catch (error) {
    if (error.response) {
      console.error("Failed to apply permissions:", error.response.status, error.response.data);
    } else {
      console.error("Error applying permissions:", error.message);
    }
  }
}
