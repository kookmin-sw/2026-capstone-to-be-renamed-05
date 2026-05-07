import type { CompanyDashboardResponse } from "@cpa/shared";

export type ProfileImageForm = {
  logoUrl: string;
};

export const emptyProfileImageForm: ProfileImageForm = {
  logoUrl: "",
};

export function toProfileImageForm(
  dashboard: CompanyDashboardResponse,
): ProfileImageForm {
  return {
    logoUrl: dashboard.company.logoUrl ?? "",
  };
}
