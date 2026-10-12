import { 
  products,
  contactInquiries,
  newsletterSubscribers,
  pageVisits,
  type Product,
  type InsertProduct,
  type ContactInquiry,
  type InsertContactInquiry,
  type NewsletterSubscriber,
  type InsertNewsletterSubscriber,
  type PageVisit,
  type InsertPageVisit
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, count } from "drizzle-orm";

export interface IStorage {
  getAllProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  
  createContactInquiry(inquiry: InsertContactInquiry & { ipAddress?: string; language?: string }): Promise<ContactInquiry>;
  getAllContactInquiries(): Promise<ContactInquiry[]>;
  
  createNewsletterSubscriber(subscriber: InsertNewsletterSubscriber & { ipAddress?: string; language?: string }): Promise<NewsletterSubscriber>;
  getAllNewsletterSubscribers(): Promise<NewsletterSubscriber[]>;

  createPageVisit(visit: InsertPageVisit): Promise<PageVisit>;
  getAllPageVisits(limit?: number): Promise<PageVisit[]>;
  getPageVisitStats(): Promise<{ totalVisits: number; uniqueIps: number; topPaths: { path: string; count: number }[]; topCountries: { country: string; count: number }[] }>;
}

export class DatabaseStorage implements IStorage {
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createContactInquiry(insertInquiry: InsertContactInquiry & { ipAddress?: string; language?: string }): Promise<ContactInquiry> {
    const [inquiry] = await db
      .insert(contactInquiries)
      .values(insertInquiry)
      .returning();
    return inquiry;
  }

  async getAllContactInquiries(): Promise<ContactInquiry[]> {
    return await db.select().from(contactInquiries).orderBy(desc(contactInquiries.createdAt));
  }

  async createNewsletterSubscriber(insertSubscriber: InsertNewsletterSubscriber & { ipAddress?: string; language?: string }): Promise<NewsletterSubscriber> {
    const [subscriber] = await db
      .insert(newsletterSubscribers)
      .values(insertSubscriber)
      .returning();
    return subscriber;
  }

  async getAllNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
    return await db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.createdAt));
  }

  async createPageVisit(visit: InsertPageVisit): Promise<PageVisit> {
    const [pageVisit] = await db
      .insert(pageVisits)
      .values(visit)
      .returning();
    return pageVisit;
  }

  async getAllPageVisits(limit = 500): Promise<PageVisit[]> {
    return await db.select().from(pageVisits).orderBy(desc(pageVisits.createdAt)).limit(limit);
  }

  async getPageVisitStats() {
    const [totalResult] = await db.select({ count: count() }).from(pageVisits);
    const totalVisits = totalResult?.count || 0;

    const [uniqueResult] = await db.select({ count: sql<number>`count(distinct ip_address)` }).from(pageVisits);
    const uniqueIps = Number(uniqueResult?.count) || 0;

    const topPathsResult = await db
      .select({ path: pageVisits.path, count: count() })
      .from(pageVisits)
      .groupBy(pageVisits.path)
      .orderBy(desc(count()))
      .limit(10);

    const topCountriesResult = await db
      .select({ country: pageVisits.country, count: count() })
      .from(pageVisits)
      .where(sql`${pageVisits.country} IS NOT NULL`)
      .groupBy(pageVisits.country)
      .orderBy(desc(count()))
      .limit(10);

    return {
      totalVisits,
      uniqueIps,
      topPaths: topPathsResult.map(r => ({ path: r.path, count: Number(r.count) })),
      topCountries: topCountriesResult.map(r => ({ country: r.country || 'Unknown', count: Number(r.count) })),
    };
  }
}

export const storage = new DatabaseStorage();
