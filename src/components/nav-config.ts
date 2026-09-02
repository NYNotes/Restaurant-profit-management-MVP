export interface NavItem {
  key: string;
  labelKey: string; // key into the "nav" i18n namespace — see messages/*.json
  href: (restaurantId: string) => string;
}

export const DESKTOP_NAV: NavItem[] = [
  { key: "dashboard", labelKey: "dashboard", href: (id) => `/r/${id}/dashboard` },
  { key: "ingredients", labelKey: "ingredients", href: (id) => `/r/${id}/ingredients` },
  { key: "recipes", labelKey: "recipes", href: (id) => `/r/${id}/recipes` },
  { key: "menu-items", labelKey: "menuItems", href: (id) => `/r/${id}/menu-items` },
  { key: "profit-loss", labelKey: "profitLoss", href: (id) => `/r/${id}/profit-loss` },
  { key: "expenses", labelKey: "expenses", href: (id) => `/r/${id}/expenses` },
  { key: "reports", labelKey: "reports", href: (id) => `/r/${id}/reports` },
  { key: "settings", labelKey: "settings", href: (id) => `/r/${id}/settings` },
];

// The four items that live in the mobile bottom tab bar — kept short since each
// tab competes for width on a phone screen.
export const MOBILE_NAV: NavItem[] = [
  { key: "dashboard", labelKey: "home", href: (id) => `/r/${id}/dashboard` },
  { key: "profit-loss", labelKey: "profit", href: (id) => `/r/${id}/profit-loss` },
  { key: "expenses", labelKey: "expenses", href: (id) => `/r/${id}/expenses` },
  { key: "ingredients", labelKey: "ingredients", href: (id) => `/r/${id}/ingredients` },
];

// Everything else, reached from the "more" menu button in the mobile header.
export const MOBILE_MORE_NAV: NavItem[] = [
  { key: "recipes", labelKey: "recipes", href: (id) => `/r/${id}/recipes` },
  { key: "menu-items", labelKey: "menuItems", href: (id) => `/r/${id}/menu-items` },
  { key: "reports", labelKey: "reports", href: (id) => `/r/${id}/reports` },
  { key: "settings", labelKey: "settings", href: (id) => `/r/${id}/settings` },
];
