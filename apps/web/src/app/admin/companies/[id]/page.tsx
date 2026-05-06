"use client";

import { useParams } from "next/navigation";
import { CompanyForm } from "@/components/admin/company-form";

export default function EditAdminCompanyPage() {
  const params = useParams<{ id: string }>();
  return <CompanyForm companyId={params.id} />;
}
