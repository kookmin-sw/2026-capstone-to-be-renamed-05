function withId(path: string, id: string) {
  const params = new URLSearchParams({ id });
  return `${path}?${params.toString()}`;
}

export function jobDetailHref(id: string) {
  return withId("/jobs/detail/", id);
}

export function companyDetailHref(id: string) {
  return withId("/companies/detail/", id);
}

export function adminJobEditHref(id: string) {
  return withId("/admin/jobs/edit/", id);
}

export function adminCompanyEditHref(id: string) {
  return withId("/admin/companies/edit/", id);
}

export function communityDetailHref(id: string) {
  return withId("/community/detail/", id);
}

export function communityWriteHref(board?: string) {
  if (!board) return "/community/write/";
  return `/community/write/?board=${board}`;
}
