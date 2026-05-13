import {
  fetchCompanyAnalytics,
  fetchCompanyDashboard,
  fetchCompanyJobs,
  fetchCompanyJobSubmissions,
} from "@/lib/api";

export async function fetchCompanyPageData() {
  const [dashboardData, jobsData, submissionData, analyticsData] =
    await Promise.all([
      fetchCompanyDashboard(),
      fetchCompanyJobs(),
      fetchCompanyJobSubmissions(),
      fetchCompanyAnalytics(),
    ]);

  return {
    dashboard: dashboardData,
    managedJobs: jobsData.items,
    jobSubmissions: submissionData.items,
    analytics: analyticsData,
  };
}
