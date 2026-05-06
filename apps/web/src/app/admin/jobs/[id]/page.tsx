"use client";

import { useParams } from "next/navigation";
import { JobForm } from "@/components/admin/job-form";

export default function EditAdminJobPage() {
  const params = useParams<{ id: string }>();
  return <JobForm jobId={params.id} />;
}
