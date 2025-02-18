'use server';

import { db } from '@/app/db';
import { companies, type Company } from '@/schema';
import { desc } from 'drizzle-orm';
import { cookies } from 'next/headers';

export type CompaniesResponse = {
  companies: Company[];
  initialSelectedCompanyId: string | null;
};

export async function getCompanies(): Promise<CompaniesResponse> {
  const allCompanies = await db
    .select()
    .from(companies)
    .orderBy(desc(companies.createdAt));

  // Get the selected company ID from cookies instead of localStorage since this is a server component
  const cookieStore = await cookies();
  const selectedCompanyId = cookieStore.get('selectedCompanyId')?.value;

  return {
    companies: allCompanies,
    initialSelectedCompanyId: selectedCompanyId || allCompanies[0]?.id || null
  };
}
