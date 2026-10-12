import * as fs from "fs";
import * as path from "path";
import { pool } from "./db";

export async function seedStores() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id SERIAL PRIMARY KEY,
        debitor TEXT UNIQUE,
        name TEXT NOT NULL,
        city TEXT NOT NULL,
        region TEXT,
        format TEXT,
        npa TEXT NOT NULL,
        address TEXT NOT NULL,
        full_address TEXT NOT NULL,
        phone TEXT,
        has_wedge_210g BOOLEAN NOT NULL DEFAULT false,
        has_slices_115g BOOLEAN NOT NULL DEFAULT false,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        retailer TEXT NOT NULL DEFAULT 'Coop',
        availability_note TEXT
      )
    `);

    await pool.query(`ALTER TABLE stores ADD COLUMN IF NOT EXISTS retailer TEXT NOT NULL DEFAULT 'Coop'`).catch(() => {});
    await pool.query(`ALTER TABLE stores ADD COLUMN IF NOT EXISTS availability_note TEXT`).catch(() => {});
    await pool.query(`ALTER TABLE stores ALTER COLUMN debitor DROP NOT NULL`).catch(() => {});

    await pool.query(`UPDATE stores SET retailer = 'Coop' WHERE retailer IS NULL OR retailer = ''`);
    await pool.query(`UPDATE stores SET has_wedge_210g = true, has_slices_115g = true, availability_note = NULL WHERE retailer = 'Manor Food'`);

    const { rows: existing } = await pool.query(
      "SELECT COUNT(*) FROM stores WHERE retailer = 'Coop'"
    );
    const coopCount = parseInt(existing[0].count, 10);

    if (coopCount === 0) {
      const dataPath = path.join(process.cwd(), "server", "stores-data.json");
      if (fs.existsSync(dataPath)) {
        const storesData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
        for (const s of storesData) {
          await pool.query(
            `INSERT INTO stores (debitor, name, city, region, format, npa, address, full_address, phone, has_wedge_210g, has_slices_115g, latitude, longitude, retailer)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'Coop')
             ON CONFLICT (debitor) DO NOTHING`,
            [
              s.debitor, s.name, s.city, s.region || null, s.format || null,
              s.npa, s.address, s.fullAddress, s.phone || null,
              s.hasWedge210g, s.hasSlices115g,
              s.latitude || null, s.longitude || null,
            ]
          );
        }
        console.log(`[stores] Seeded ${storesData.length} Coop stores`);
      }
    }

    const { rows: manorRows } = await pool.query(
      "SELECT COUNT(*) FROM stores WHERE retailer = 'Manor Food'"
    );
    const manorCount = parseInt(manorRows[0].count, 10);

    if (manorCount === 0) {
      const manorPath = path.join(process.cwd(), "server", "manor-stores-geocoded.json");
      if (fs.existsSync(manorPath)) {
        const manorData = JSON.parse(fs.readFileSync(manorPath, "utf-8"));
        for (const s of manorData) {
          const fullAddress = `${s.street}, ${s.npa} ${s.city}, Suisse`;
          await pool.query(
            `INSERT INTO stores (name, city, npa, address, full_address, has_wedge_210g, has_slices_115g, latitude, longitude, retailer, availability_note)
             VALUES ($1,$2,$3,$4,$5,true,true,$6,$7,'Manor Food',NULL)`,
            [
              `Manor Food ${s.name}`, s.city, s.npa, s.street,
              fullAddress, s.lat || null, s.lon || null,
            ]
          );
        }
        console.log(`[stores] Seeded ${manorData.length} Manor Food stores`);
      }
    }
  } catch (err) {
    console.error("[stores] Seed error:", err);
  }
}
