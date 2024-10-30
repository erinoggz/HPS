# Revkeep UTIL Hasura Permission Set

This script dumps and applies metadata to a Hasura instance. It creates new metadata from a YAML consiting of roles and permissions. And it dumps previous tables/roles and permissions into a YAML file.

## Prerequisites

- **Node.js** and **TypeScript** installed.
- **Hasura URL** and **Admin Secret**: The Hasura instance URL and admin secret are required for authentication.
- **YAML Metadata File**: The `metadata.yml` file should be present in the project directory.

## Setup Instructions

1. **Install dependencies**: Run `npm install` to install required packages.
2. **Create the dump directory** (if not automatically created): The script will save the current metadata to `dump/metadata.yml` before making any updates.

## Usage

To run the script, use the following command:
```bash
npx ts-node app.ts -e <HASURA_URL> -s <HASURA_ADMIN_SECRET>
```
