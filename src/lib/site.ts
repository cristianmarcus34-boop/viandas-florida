const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://viandas-florida.vercel.app";

export const siteUrl = new URL(configuredSiteUrl).origin;
