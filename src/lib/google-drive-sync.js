/* global process */

import * as fs from "fs";
import * as path from "path";
import { google } from "googleapis";

import { convertAll } from "./sync-folder.js";


const FOLDER_ID = "1pPwHb83PcTuES1F2019E2hFMM84Pc_1i";

console.log("FOLDER_ID:", FOLDER_ID);

const auth = new google.auth.GoogleAuth({
  keyFile: path.resolve("credentials/service-account.json"),
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
});

const drive = google.drive({
  version: "v3",
  auth,
});

const DATASETS = [
  "estoque",
  "compras",
  "consumo",
  "vendas",
  "ordens",
];

const DATA_DIR = path.resolve("data-source");

fs.mkdirSync(DATA_DIR, { recursive: true });

async function listFiles() {
  const res = await drive.files.list({
    q: `'${FOLDER_ID}' in parents and trashed=false`,
    fields: "files(id,name)",
    pageSize: 20,
  });

  return res.data.files;
}

async function download(fileId, destination) {
  const dest = fs.createWriteStream(destination);

  const res = await drive.files.get(
    {
      fileId,
      alt: "media",
    },
    {
      responseType: "stream",
    }
  );

  await new Promise((resolve, reject) => {
    res.data.pipe(dest);

    dest.on("finish", resolve);
    dest.on("error", reject);
  });
}



async function sync() {
  console.log("Conectando ao Google Drive...");

  const files = await listFiles();

  for (const dataset of DATASETS) {

    const file = files.find(
      f => f.name.toLowerCase() === `${dataset}.xlsx`
    );

    if (!file) {
      console.log(`❌ ${dataset}.xlsx não encontrado.`);
      continue;
    }

    const destination = path.join(DATA_DIR, `${dataset}.xlsx`);

    console.log(`⬇ Baixando ${file.name}...`);

    await download(file.id, destination);

    console.log(`✅ ${dataset}.xlsx atualizado.`);
  }

  console.log("\nConvertendo Excel para JSON...\n");

  convertAll();

  console.log("\n✔ Sincronização concluída.");
}

sync().catch(console.error);