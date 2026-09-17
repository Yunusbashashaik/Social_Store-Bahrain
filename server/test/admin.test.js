import "./isolateDurablePaths.js";
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import fs from "fs";
import os from "os";
import path from "path";
import express from "express";
import request from "supertest";
import { closeDatabase, initDatabase } from "../src/db/connection.js";
import { seedDatabase } from "../src/db/seed.js";
import { seedWithFactory } from "./factorySeedEnv.js";
import { adminRouter } from "../src/routes/admin.js";
import { servicesRouter } from "../src/routes/services.js";
import { settingsRouter } from "../src/routes/settings.js";
import { DEFAULT_SERVICES } from "../../shared/defaultServices.js";

const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "gs-admin-"));

describe("services + admin API", () => {
  let app;

  before(async () => {
    initDatabase(path.join(testDir, "test.db"));
    await seedWithFactory(seedDatabase);
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use("/api/services", servicesRouter);
    app.use("/api/settings", settingsRouter);
    app.use("/api/admin", adminRouter);
  });

  after(() => {
    closeDatabase();
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it("lists services publicly from the database", async () => {
    const res = await request(app).get("/api/services");
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.services));
    assert.equal(res.body.services.length, DEFAULT_SERVICES.length);
    assert.equal(res.body.services[0].id, "netflix-prime-combo");
  });

  it("lists public settings from the database", async () => {
    const res = await request(app).get("/api/settings");
    assert.equal(res.status, 200);
    assert.ok(res.body.settings.complaintEmail);
    assert.ok(Array.isArray(res.body.settings.whatsappNumbers));
  });

  it("rejects bad login", async () => {
    const res = await request(app)
      .post("/api/admin/login")
      .send({ username: "admin", password: "wrong" });
    assert.equal(res.status, 401);
  });

  it("logs in and updates a service price/description", async () => {
    const login = await request(app)
      .post("/api/admin/login")
      .send({ username: "admin", password: "Qz@02846?" });
    assert.equal(login.status, 200);
    assert.ok(login.body.token);

    const token = login.body.token;
    const created = await request(app)
      .post("/api/admin/services")
      .set("Authorization", `Bearer ${token}`)
      .field("nameEn", "Price Edit")
      .field("nameAr", "تعديل السعر")
      .field("descriptionEn", "EN")
      .field("descriptionAr", "AR")
      .field("priceMonth", "1")
      .field("priceYear", "8");
    const id = created.body.service.id;
    const update = await request(app)
      .put(`/api/admin/services/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        prices: { month: 3, year: 20 },
        descriptionEn: "Updated EN desc",
        descriptionAr: "وصف محدث",
      });
    assert.equal(update.status, 200);
    assert.equal(update.body.service.prices.month, 3);
    assert.equal(update.body.service.prices.year, 20);
    assert.equal(update.body.service.descriptionEn, "Updated EN desc");

    const listed = await request(app).get("/api/services");
    const item = listed.body.services.find((s) => s.id === id);
    assert.equal(item.prices.month, 3);
    assert.equal(item.descriptionAr, "وصف محدث");
  });

  it("creates a new service that appears on the public list", async () => {
    const login = await request(app)
      .post("/api/admin/login")
      .send({ username: "admin", password: "Qz@02846?" });
    const token = login.body.token;

    const create = await request(app)
      .post("/api/admin/services")
      .set("Authorization", `Bearer ${token}`)
      .field("nameEn", "Test Stream")
      .field("nameAr", "اختبار")
      .field("descriptionEn", "EN desc")
      .field("descriptionAr", "AR desc")
      .field("priceMonth", "2.5")
      .field("priceYear", "18");

    assert.equal(create.status, 201);
    assert.equal(create.body.service.nameEn, "Test Stream");
    assert.equal(create.body.service.prices.month, 2.5);

    const listed = await request(app).get("/api/services");
    assert.equal(listed.body.services[0].nameEn, "Test Stream");
    const item = listed.body.services.find((s) => s.nameEn === "Test Stream");
    assert.ok(item);
  });

  it("marks zero-price services as out of stock", async () => {
    const login = await request(app)
      .post("/api/admin/login")
      .send({ username: "admin", password: "Qz@02846?" });
    const token = login.body.token;

    const created = await request(app)
      .post("/api/admin/services")
      .set("Authorization", `Bearer ${token}`)
      .field("nameEn", "OOS Service")
      .field("descriptionEn", "EN")
      .field("descriptionAr", "AR")
      .field("priceMonth", "1")
      .field("priceYear", "8");
    const update = await request(app)
      .put(`/api/admin/services/${created.body.service.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ prices: { month: 0, year: 0 } });

    assert.equal(update.status, 200);
    assert.equal(update.body.service.outOfStock, true);
    assert.equal(update.body.service.prices.month, 0);
  });

  it("updates complaint email and WhatsApp numbers in settings", async () => {
    const login = await request(app)
      .post("/api/admin/login")
      .send({ username: "admin", password: "Qz@02846?" });
    const token = login.body.token;

    const update = await request(app)
      .put("/api/admin/settings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        complaintEmail: "ops@example.com",
        whatsappNumbers: ["96550001111", "96550002222"],
        aboutEn: "New about",
        socialLinks: { instagram: "https://instagram.com/example" },
      });

    assert.equal(update.status, 200);
    assert.equal(update.body.settings.complaintEmail, "ops@example.com");
    assert.deepEqual(update.body.settings.whatsappNumbers, [
      "96550001111",
      "96550002222",
    ]);
    assert.equal(update.body.settings.aboutEn, "New about");
    assert.equal(
      update.body.settings.socialLinks.instagram,
      "https://instagram.com/example",
    );

    const publicSettings = await request(app).get("/api/settings");
    assert.equal(publicSettings.body.settings.complaintEmail, "ops@example.com");
  });

  it("requires auth for updates", async () => {
    const res = await request(app)
      .put("/api/admin/services/missing-service")
      .send({ prices: { month: 9 } });
    assert.equal(res.status, 401);
  });

  it("keeps admin-added services after another seed", async () => {
    const login = await request(app)
      .post("/api/admin/login")
      .send({ username: "admin", password: "Qz@02846?" });
    const token = login.body.token;
    const created = await request(app)
      .post("/api/admin/services")
      .set("Authorization", `Bearer ${token}`)
      .field("nameEn", "Keep Me")
      .field("descriptionEn", "EN")
      .field("descriptionAr", "AR")
      .field("priceMonth", "4")
      .field("priceYear", "30");
    assert.equal(created.status, 201);
    await seedDatabase();
    const listed = await request(app).get("/api/services");
    assert.ok(listed.body.services.some((s) => s.id === "netflix-prime-combo"));
    assert.ok(listed.body.services.some((s) => s.id === created.body.service.id));
  });

  it("does not restore a built-in catalog after seed", async () => {
    const res = await request(app).get("/api/services");
    assert.equal(res.status, 200);
    await seedDatabase();
    const again = await request(app).get("/api/services");
    assert.equal(again.body.services.some((s) => s.id === "builtin-one"), false);
    assert.equal(again.body.services.some((s) => s.id === "builtin-two"), false);
  });

  it("deletes a service from the public catalog", async () => {
    const login = await request(app)
      .post("/api/admin/login")
      .send({ username: "admin", password: "Qz@02846?" });
    const token = login.body.token;

    const created = await request(app)
      .post("/api/admin/services")
      .set("Authorization", `Bearer ${token}`)
      .field("nameEn", "Temp Delete Me")
      .field("descriptionEn", "EN")
      .field("descriptionAr", "AR")
      .field("priceMonth", "1")
      .field("priceYear", "8");
    assert.equal(created.status, 201);
    const id = created.body.service.id;

    const del = await request(app)
      .delete(`/api/admin/services/${id}`)
      .set("Authorization", `Bearer ${token}`);
    assert.equal(del.status, 200);

    const listed = await request(app).get("/api/services");
    assert.equal(
      listed.body.services.some((s) => s.id === id),
      false,
    );
  });

  it("returns and updates owner copy in public settings", async () => {
    const res = await request(app).get("/api/settings");
    assert.ok(res.body.settings.ownersEn);

    const login = await request(app)
      .post("/api/admin/login")
      .send({ username: "admin", password: "Qz@02846?" });
    const token = login.body.token;
    const put = await request(app)
      .put("/api/admin/settings")
      .set("Authorization", `Bearer ${token}`)
      .send({ ownersEn: "Owned by Test Owners" });
    assert.equal(put.status, 200);
    assert.equal(put.body.settings.ownersEn, "Owned by Test Owners");

    const again = await request(app).get("/api/settings");
    assert.equal(again.body.settings.ownersEn, "Owned by Test Owners");
  });

  it("migrates the old Qatar WhatsApp number to Bahrain on seed", async () => {
    const login = await request(app)
      .post("/api/admin/login")
      .send({ username: "admin", password: "Qz@02846?" });
    const token = login.body.token;
    await request(app)
      .put("/api/admin/settings")
      .set("Authorization", `Bearer ${token}`)
      .send({ whatsappNumbers: ["923394077636", "97466382981"] });

    await seedDatabase();
    const res = await request(app).get("/api/settings");
    assert.deepEqual(res.body.settings.whatsappNumbers, [
      "923394077636",
      "97366382981",
    ]);
  });

  it("translates English service copy to Arabic", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          responseData: { translatedText: "مرحبا بالعالم" },
        }),
    });
    try {
      const login = await request(app)
        .post("/api/admin/login")
        .send({ username: "admin", password: "Qz@02846?" });
      const res = await request(app)
        .post("/api/admin/translate")
        .set("Authorization", `Bearer ${login.body.token}`)
        .send({ text: "Hello World" });
      assert.equal(res.status, 200);
      assert.equal(res.body.text, "مرحبا بالعالم");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("rejects unauthenticated translate and delete", async () => {
    const translate = await request(app)
      .post("/api/admin/translate")
      .send({ text: "Hello" });
    assert.equal(translate.status, 401);

    const del = await request(app).delete("/api/admin/services/missing-service");
    assert.equal(del.status, 401);
  });

  it("creates a regular service without an offer", async () => {
    const login = await request(app)
      .post("/api/admin/login")
      .send({ username: "admin", password: "Qz@02846?" });
    const created = await request(app)
      .post("/api/admin/services")
      .set("Authorization", `Bearer ${login.body.token}`)
      .field("nameEn", "Plain Service")
      .field("descriptionEn", "EN")
      .field("descriptionAr", "AR")
      .field("priceMonth", "3")
      .field("priceYear", "20");
    assert.equal(created.status, 201);
    assert.equal(created.body.service.offerType, "none");
    assert.equal(created.body.service.offerExpiresAt, null);
    const listed = await request(app).get("/api/services");
    assert.ok(listed.body.services.some((s) => s.id === created.body.service.id));
  });

  it("creates an offer service and hides it from the public list after expiry", async () => {
    const login = await request(app)
      .post("/api/admin/login")
      .send({ username: "admin", password: "Qz@02846?" });
    const token = login.body.token;
    const created = await request(app)
      .post("/api/admin/services")
      .set("Authorization", `Bearer ${token}`)
      .field("nameEn", "Flash Offer")
      .field("descriptionEn", "EN")
      .field("descriptionAr", "AR")
      .field("priceMonth", "1")
      .field("priceYear", "8")
      .field("offerType", "special")
      .field("offerExpiresAt", new Date(Date.now() + 120_000).toISOString());
    assert.equal(created.status, 201);
    assert.equal(created.body.service.offerType, "special");
    assert.ok(created.body.service.offerExpiresAt);

    const live = await request(app).get("/api/services");
    assert.ok(live.body.services.some((s) => s.id === created.body.service.id));

    const expired = await request(app)
      .put(`/api/admin/services/${created.body.service.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ offerType: "special", offerExpiresAt: new Date(Date.now() - 1000).toISOString() });
    assert.equal(expired.status, 200);

    const after = await request(app).get("/api/services");
    assert.equal(after.body.services.some((s) => s.id === created.body.service.id), false);

    const adminList = await request(app)
      .get("/api/admin/services")
      .set("Authorization", `Bearer ${token}`);
    assert.ok(adminList.body.services.some((s) => s.id === created.body.service.id));
  });

  it("exports and imports admin-state.json", async () => {
    const login = await request(app)
      .post("/api/admin/login")
      .send({ username: "admin", password: "Qz@02846?" });
    const token = login.body.token;
    const exported = await request(app)
      .get("/api/admin/state")
      .set("Authorization", `Bearer ${token}`);
    assert.equal(exported.status, 200);
    assert.ok(Array.isArray(exported.body.services));
    assert.ok(exported.body.services.length > 0);

    const custom = {
      version: 1,
      savedAt: "2026-09-17T00:00:00.000Z",
      services: [
        {
          id: "imported-live",
          nameEn: "Imported Live",
          nameAr: "مستورد",
          descriptionEn: "en",
          descriptionAr: "ar",
          prices: { month: 5, year: 40 },
        },
      ],
      settings: { catalogSeeded: true, complaintEmail: "import@example.com" },
    };
    const imported = await request(app)
      .put("/api/admin/state")
      .set("Authorization", `Bearer ${token}`)
      .send(custom);
    assert.equal(imported.status, 200);
    assert.equal(imported.body.state.services[0].nameEn, "Imported Live");

    const listed = await request(app).get("/api/services");
    assert.equal(listed.body.services.length, 1);
    assert.equal(listed.body.services[0].id, "imported-live");
  });
});
