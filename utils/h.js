import "dotenv/config";
import fetch from "node-fetch";
import pg from "pg";
import { glob } from "glob";
import fs from "fs";
import { promisify } from "util";
import { exec } from "child_process";
import util from "util";
import path from "path";

const { Client } = pg;
const globP = promisify(glob);
const HASURA_ENDPOINT = `http://100.75.112.47:${process.env.HASURA_LISTEN_PORT}/v1/query`;
const HASURA_ADMIN_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET;
const NEW_ROLE = process.env.NEW_ROLE;

const client = new Client({
  user: "postgres",
  host: "100.75.112.47",
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_DEV_PORT,
});

const headers = {
  "Content-Type": "application/json",
  "X-Hasura-Admin-Secret": HASURA_ADMIN_SECRET,
};

async function trackUntrackedItems() {
  try {
    console.log("Connecting to the database...");
    await client.connect();
    console.log("Connected to the database.");
    console.log("Tracking tables and functions...");
    await trackTables();
    console.log("Tracked...");
    //await trackFunctions();
    //await trackNewRelations();
    console.log("Set permissions...");
    await setPermissions();
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

async function trackTables() {
  try {
    const res = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
    );
    const tables = res.rows.map((row) => row.table_name);

    for (const table of tables) {
      const trackTableQuery = {
        type: "track_table",
        args: {
          schema: "public",
          name: table,
        },
      };

      const response = await fetch(HASURA_ENDPOINT, {
        method: "POST",
        headers,
        body: JSON.stringify(trackTableQuery),
      });

      if (response.ok) {
        console.log(`Table tracked successfully: ${table}`);
      }
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

async function trackFunctions() {
  const functionRes = await client.query(
    `SELECT p.proname
     FROM pg_catalog.pg_namespace n
     JOIN pg_catalog.pg_proc p ON p.pronamespace = n.oid
     WHERE n.nspname = 'public'
       AND p.proretset
       AND NOT p.proname LIKE '%pgp_%';`
  );

  const functions = functionRes.rows.map((row) => row.proname);

  const alreadyTracked = [];

  for (const fn of functions) {
    if (alreadyTracked.includes(fn)) continue;

    const trackFunctionQuery = {
      type: "track_function",
      args: {
        schema: "public",
        name: fn,
      },
    };

    const response = await fetch(HASURA_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify(trackFunctionQuery),
    });

    const data = await response.json();
    if (response.ok) {
      console.log(`Function tracked successfully: ${fn}`);
      alreadyTracked.push(fn);
    }
  }
}

async function getHasuraMetadata() {
  try {
    const response = await fetch(HASURA_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({ type: "export_metadata", args: {} }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.sources;
  } catch (error) {
    console.error("Error fetching Hasura metadata:", error);
    return null;
  }
}

async function trackRelationship(type, relationship, table) {
  console.log(
    `Tracking ${type} ${relationship.name} for table ${table.name}...`
  );
  const using = {
    foreign_key_constraint_on: relationship.using.foreign_key_constraint_on,
  };

  const trackRelationQuery = {
    type: type,
    args: {
      table: { name: table.name, schema: table.schema },
      name: relationship.name,
      using: using,
    },
  };

  try {
    const response = await fetch(`${HASURA_ENDPOINT}`, {
      method: "POST",
      headers,
      body: JSON.stringify(trackRelationQuery),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(
        `Error tracking ${type} ${relationship.name} for table ${table.name}:`,
        error
      );
    } else {
      console.log(
        `${type} ${relationship.name} for table ${table.name} tracked successfully.`
      );
    }
  } catch (error) {
    console.error(
      `Error tracking ${type} ${relationship.name} for table ${table.name}:`,
      error
    );
  }
}

// Extract foreign key relationships from SQL statements
function extractForeignKeys(sqlStatements) {
  const foreignKeys = [];
  const regex =
    /ALTER TABLE ONLY public\.(\w+)\s+ADD CONSTRAINT "\w+" FOREIGN KEY \((\w+)\) REFERENCES public\.(\w+)\(id\);/g;
  let match;
  while ((match = regex.exec(sqlStatements)) !== null) {
    foreignKeys.push({
      table: match[1],
      column: match[2],
      referencedTable: match[3],
    });
  }
  return foreignKeys;
}

async function getLatestMigrationFile() {
  const directoryPath = "./hasura/migrations/default";

  // Use glob to get all .sql files in the directory
  const migrationFiles = await globP(`${directoryPath}/*/up.sql`);

  // Function to extract timestamp from file path
  const extractTimestamp = (filePath) => {
    const fileName = filePath.split("/")[4];
    return Number(fileName.split("_")[0]);
  };

  // Sort the files by the timestamp in their name
  migrationFiles.sort((a, b) => {
    const timestampA = extractTimestamp(a);
    const timestampB = extractTimestamp(b);
    return timestampB - timestampA;
  });

  // The most recent file is the first one in the sorted array
  return migrationFiles[0];
}

// Export the migrations from the Hasura instance
async function exportMigrations() {
  const execAsync = util.promisify(exec);
  try {
    await execAsync("scripts/export-migrations.sh");
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
  }
}

// Compare the extracted relationships with those already tracked in the Hasura metadata
async function trackNewRelations() {
  let sqlStatements;

  // Generate actual migration file
  await exportMigrations();

  // Get the most recent migration file
  const latestMigrationFile = await getLatestMigrationFile();

  // Read the content of the most recent file
  sqlStatements = fs.readFileSync(latestMigrationFile, "utf8");

  // Delete the most recent migration file
  await fs.promises.rm(path.dirname(latestMigrationFile), { recursive: true });

  const foreignKeys = extractForeignKeys(sqlStatements);
  // console.log("Extracted foreign keys:", foreignKeys);
  const metadata = await getHasuraMetadata();
  if (metadata) {
    for (const table of metadata[0].tables) {
      for (const foreignKey of foreignKeys) {
        if (table.table.name === foreignKey.table) {
          const isTracked = table.object_relationships?.some(
            (rel) => rel.using.foreign_key_constraint_on === foreignKey.column
          );

          if (!isTracked) {
            // Create object relationship for foreign key
            await trackRelationship(
              "create_object_relationship",
              {
                name: foreignKey.referencedTable,
                using: {
                  foreign_key_constraint_on: foreignKey.column,
                },
              },
              table.table
            );

            // Create array relationship for foreign key
            await trackRelationship(
              "create_array_relationship",
              {
                name: foreignKey.referencedTable + "_relationship",
                using: {
                  foreign_key_constraint_on: {
                    column: foreignKey.column,
                    table: {
                      name: table.table.name,
                      schema: "public",
                    },
                  },
                },
              },
              {
                name: foreignKey.referencedTable,
                schema: "public",
              }
            );
          }
        }
      }
    }
  }
}

// Set permissions for insert, select, update, delete, and aggregation for all tables
async function setPermissions() {
  const res = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
  );
  const tables = res.rows.map((row) => row.table_name);

  for (const table of tables) {
    await setTablePermissions(table, "insert");
    await setTablePermissions(table, "select");
    await setTablePermissions(table, "update");
    await setTablePermissions(table, "delete");
  }
}

async function setTablePermissions(table, action) {
  const permissionQuery = {
    type: `bulk`,
    source: "data_o_tron_test",
    args: [
      {
        type: `create_${action}_permission`,
        args: {
          source: "data_o_tron_test",
          table: {
            schema: "public",
            name: table,
          },
          role: NEW_ROLE,
          permission: {
            columns: "*",
            filter: {}, // set appropriate filters if needed
            check: action === "insert" || action === "update" ? {} : undefined, // check condition is only for insert and update
            allow_aggregations: action === "select" ? true : undefined, // allow aggregations only for select_aggregate
          },
        },
      },
    ],
  };

  try {
    const response = await fetch(HASURA_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify(permissionQuery),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`Error setting ${action} permission for table ${table}:`, error);
    } else {
      console.log(`Permission ${action} set successfully for table ${table}.`);
    }
  } catch (error) {
    console.error(`Error setting ${action} permission for table ${table}:`, error);
  }
}

console.log("Tracking tables and functions...");
await trackUntrackedItems();