import type { Brand } from "./domain.ts";
import { themes } from "./domain.ts";

export const productBrand = {
  name: "CercaVet",
  tagline: "Cerca, en cada cuidado.",
  primary: "#234b42",
  accent: "#d6e6b7",
  arc: "M43 14a22 22 0 1 0 0 36",
};

export function clinicIdentity(brand: Brand) {
  return {
    isProduct: brand.name.trim().toLowerCase() === productBrand.name.toLowerCase() && !brand.logo,
    initials: brand.name.trim().split(/\s+/).slice(0, 2).map((word) => Array.from(word)[0]).join("").toUpperCase() || "CL",
  };
}

export function clinicFavicon(brand: Brand) {
  if (brand.logo) return brand.logo;
  const { isProduct, initials } = clinicIdentity(brand);
  const colors = themes[brand.theme];
  const safeInitials = initials.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const symbol = isProduct
    ? `<path d="${productBrand.arc}" fill="none" stroke="white" stroke-width="9" stroke-linecap="round"/><circle cx="46" cy="32" r="6" fill="${colors.accent}"/>`
    : `<text x="32" y="42" text-anchor="middle" font-family="sans-serif" font-size="26" font-weight="600" fill="white">${safeInitials}</text>`;
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="${colors.primary}"/>${symbol}</svg>`)}`;
}
