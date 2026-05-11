import type { CompanyDashboardResponse } from "@cpa/shared";

export type ProfileImageForm = {
  assetId: string;
  imageUrl: string;
};

export const emptyProfileImageForm: ProfileImageForm = {
  assetId: "",
  imageUrl: "",
};

export function toLogoProfileImageForm(
  dashboard: CompanyDashboardResponse,
): ProfileImageForm {
  return {
    assetId: "",
    imageUrl: dashboard.company.logoUrl ?? "",
  };
}

export function toBackgroundProfileImageForm(
  dashboard: CompanyDashboardResponse,
): ProfileImageForm {
  return {
    assetId: "",
    imageUrl: dashboard.company.backgroundUrl ?? "",
  };
}
