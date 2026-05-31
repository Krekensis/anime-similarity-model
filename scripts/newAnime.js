import fs from "fs";
import path from "path";

const BASE_URL = "https://api.jikan.moe/v4/anime";
const RAW_DIR = "./data/raw";

// ================== CONFIG ==================
const START_PAGE = 14;
const MAX_PAGES = 2000;

const BATCH_SIZE = 5;     // parallel requests per batch
const INTRA_DELAY = 1000;  // ms between requests in same batch
const INTER_DELAY = 1000;  // ms between batches
const FETCH_TIMEOUT = 10000; // ms
// ============================================

if (!fs.existsSync(RAW_DIR)) {
  fs.mkdirSync(RAW_DIR, { recursive: true });
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// ================== HELPERS ==================

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

// ================== CORE ==================

async function fetchAndSavePage(page) {
  console.log(`📥 Fetching page ${page}...`);

  const res = await fetchWithTimeout(
    `${BASE_URL}?page=${page}`,
    FETCH_TIMEOUT
  );

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} on page ${page}`);
  }

  const json = await res.json();

  if (!json.data || json.data.length === 0) {
    console.log(`⚠️ Empty data on page ${page}`);
    return;
  }

  const filePath = path.join(RAW_DIR, `anime_page_${page}.json`);
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2));

  console.log(`✅ Saved page ${page}`);
}

// ================== PIPELINE ==================

async function fetchAllAnimeBatched() {
  const pages = [];
  for (let p = START_PAGE; p <= MAX_PAGES; p++) {
    pages.push(p);
  }

  const batches = chunkArray(pages, BATCH_SIZE);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`\nStarting batch ${i + 1} (${batch.join(", ")})`);

    const promises = batch.map((page, idx) =>
      new Promise((resolve) => {
        setTimeout(async () => {
          try {
            await fetchAndSavePage(page);
          } catch (err) {
            console.error(`❌ Page ${page}:`, err.message);
          } finally {
            resolve();
          }
        }, idx * INTRA_DELAY);
      })
    );

    await Promise.allSettled(promises);

    console.log(`✅ Finished batch ${i + 1}`);

    if (i < batches.length - 1) {
      await sleep(INTER_DELAY);
    }
  }

  console.log("\n🎉 Anime data collection complete.");
}

// ================== START ==================
fetchAllAnimeBatched();

