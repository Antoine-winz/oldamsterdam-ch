import { pgTable, text, timestamp, jsonb, serial, integer, boolean, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: jsonb("name").notNull().$type<{ en: string; fr: string; de: string; it: string }>(),
  weight: text("weight").notNull(),
  description: jsonb("description").notNull().$type<{ en: string; fr: string; de: string; it: string }>(),
  image: text("image").notNull(),
  productUrl: text("product_url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export const contactInquiries = pgTable("contact_inquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company").notNull(),
  message: text("message").notNull(),
  ipAddress: text("ip_address"),
  language: text("language"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertContactInquirySchema = createInsertSchema(contactInquiries).omit({
  id: true,
  createdAt: true,
  ipAddress: true,
  language: true,
});

export type InsertContactInquiry = z.infer<typeof insertContactInquirySchema>;
export type ContactInquiry = typeof contactInquiries.$inferSelect;

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  ipAddress: text("ip_address"),
  language: text("language"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).omit({
  id: true,
  createdAt: true,
  ipAddress: true,
  language: true,
});

export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;

export const pageVisits = pgTable("page_visits", {
  id: serial("id").primaryKey(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  path: text("path").notNull(),
  language: text("language"),
  referrer: text("referrer"),
  country: text("country"),
  city: text("city"),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPageVisitSchema = createInsertSchema(pageVisits).omit({
  id: true,
  createdAt: true,
});

export type InsertPageVisit = z.infer<typeof insertPageVisitSchema>;
export type PageVisit = typeof pageVisits.$inferSelect;

export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  debitor: text("debitor").unique(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  region: text("region"),
  format: text("format"),
  npa: text("npa").notNull(),
  address: text("address").notNull(),
  fullAddress: text("full_address").notNull(),
  phone: text("phone"),
  hasWedge210g: boolean("has_wedge_210g").notNull().default(false),
  hasSlices115g: boolean("has_slices_115g").notNull().default(false),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  retailer: text("retailer").notNull().default("Coop"),
  availabilityNote: text("availability_note"),
});

export type Store = typeof stores.$inferSelect;
export type StoreWithDistance = Store & { distance: number };
