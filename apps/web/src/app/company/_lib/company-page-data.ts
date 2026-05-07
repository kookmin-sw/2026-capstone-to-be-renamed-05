import {
  fetchCompanyDashboard,
  fetchCompanyJobs,
  fetchCompanyJobSubmissions,
} from "@/lib/api";

export async function fetchCompanyPageData() {
  const [dashboardData, jobsData, submissionData] = await Promise.all([
    fetchCompanyDashboard(),
    fetchCompanyJobs(),
    fetchCompanyJobSubmissions(),
  ]);

  return {
    dashboard: dashboardData,
    managedJobs: jobsData.items,
    jobSubmissions: submissionData.items,
  };
}
