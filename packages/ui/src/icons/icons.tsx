// Набор иконок системы. Обводка 1.5, сетка 20×20, цвет — currentColor.
// Иконка не компонент системы: у неё нет контракта и ступени, это сырьё для компонентов.
import type { ReactElement } from "react";

const paths = {
  search: "M9 15.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM17.5 17.5l-3.9-3.9",
  x: "M5 5l10 10M15 5L5 15",
  plus: "M10 4v12M4 10h12",
  check: "M4.5 10.5l3.5 3.5 7.5-8",
  minus: "M5 10h10",
  "chevron-down": "M5.5 8l4.5 4.5L14.5 8",
  "chevron-right": "M8 5.5l4.5 4.5L8 14.5",
  more: "M4.5 10h.01M10 10h.01M15.5 10h.01",
  user: "M10 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM3.5 17c.9-3 3.4-4.5 6.5-4.5s5.6 1.5 6.5 4.5",
  users: "M7.5 9.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 16.5c.7-2.6 2.8-4 5.5-4s4.8 1.4 5.5 4M13 3.7a3 3 0 0 1 0 5.6M14.5 12.7c1.7.5 3 1.8 3.5 3.8",
  home: "M3.5 9 10 3.5 16.5 9v7.5h-4.5v-5h-4v5H3.5V9Z",
  briefcase: "M3 7h14v9.5H3V7ZM7 7V4.5h6V7M3 11.5h14",
  inbox: "M3 11.5 5 4h10l2 7.5v5H3v-5ZM3 11.5h4.5l1 2h3l1-2H17",
  settings: "M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM16.2 11.8l1.3.8-1.6 2.8-1.4-.6a6 6 0 0 1-1.6.9L12.7 17H9.3l-.2-1.3a6 6 0 0 1-1.6-.9l-1.4.6-1.6-2.8 1.3-.8a6 6 0 0 1 0-1.8l-1.3-.8 1.6-2.8 1.4.6a6 6 0 0 1 1.6-.9L9.3 3h3.4l.2 1.3a6 6 0 0 1 1.6.9l1.4-.6 1.6 2.8-1.3.8a6 6 0 0 1 0 1.8Z",
  mail: "M3 5h14v10H3V5ZM3.5 5.5 10 11l6.5-5.5",
  phone: "M6.5 3h-3c0 7.5 6 13.5 13.5 13.5v-3l-3.5-1.5-1.5 1.5c-2-1-3.5-2.5-4.5-4.5L9 7.5 6.5 3Z",
  trash: "M4 6h12M8 6V4h4v2M5.5 6l.8 10.5h7.4L14.5 6",
  edit: "M12.5 4.5l3 3L7 16H4v-3l8.5-8.5Z",
  alert: "M10 6.5v4.5M10 14h.01M10 2.5 18 17H2l8-14.5Z",
  folder: "M2.5 5.5h5l1.5 2h8.5v8.5h-15V5.5Z",
  calendar: "M3.5 5h13v11.5h-13V5ZM3.5 8.5h13M7 3v4M13 3v4",
  filter: "M3 4.5h14l-5.5 6.5v5l-3 1.5V11L3 4.5Z",
  sort: "M6 4v12M3 13l3 3 3-3M14 16V4M11 7l3-3 3 3",
  receipt: "M5 2.5h10v15l-2-1.2-1.5 1.2L10 16.3l-1.5 1.2L7 16.3l-2 1.2v-15ZM7.5 6.5h5M7.5 9.5h5M7.5 12.5h3",
  package: "M10 2.5 17 6v8l-7 3.5L3 14V6l7-3.5ZM3 6l7 3.5L17 6M10 9.5v8M6.5 4.3l7 3.5",
  tag: "M3 3h7l7 7-7 7-7-7V3ZM6.5 6.5h.01",
  layers: "M10 3 17.5 7 10 11 2.5 7 10 3ZM2.5 10.5 10 14.5l7.5-4M2.5 14 10 18l7.5-4",
  percent: "M15 5 5 15M6 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM14 16a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  truck: "M2.5 5h9v8.5h-9V5ZM11.5 8h3.5l2.5 3v2.5h-6M6 16.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM14.5 16.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
  "credit-card": "M2.5 5h15v10h-15V5ZM2.5 8.5h15M5.5 12h3",
  euro: "M14.5 5.5a5.5 5.5 0 1 0 0 9M3.5 8.5h7M3.5 11.5h7",
  store: "M3 8 4.5 3.5h11L17 8M3 8c0 1.4 1.1 2.5 2.5 2.5S8 9.4 8 8c0 1.4 1 2.5 2 2.5s2-1.1 2-2.5c0 1.4 1.1 2.5 2.5 2.5S17 9.4 17 8M4 10.5V17h12v-6.5M8 17v-4h4v4",
  globe: "M10 17.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15ZM2.5 10h15M10 2.5c2 2 3 4.5 3 7.5s-1 5.5-3 7.5c-2-2-3-4.5-3-7.5s1-5.5 3-7.5Z",
  "map-pin": "M10 18s5.5-5 5.5-9.5a5.5 5.5 0 0 0-11 0C4.5 13 10 18 10 18ZM10 10.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  image: "M3 4h14v12H3V4ZM3 13l4-4 3 3 2-2 5 5M12.5 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  bell: "M5 13.5V9a5 5 0 0 1 10 0v4.5l1.5 2h-13l1.5-2ZM8.5 17.5h3",
  copy: "M7 7h9.5v9.5H7V7ZM13 7V3.5H3.5V13H7",
  download: "M10 3v10M5.5 8.5 10 13l4.5-4.5M3.5 16.5h13",
  upload: "M10 13V3M5.5 7.5 10 3l4.5 4.5M3.5 16.5h13",
  archive: "M2.5 4h15v3.5h-15V4ZM4 7.5V16h12V7.5M8 10.5h4",
  refresh: "M16.5 9.5A6.5 6.5 0 0 0 4.6 6M3.5 10.5A6.5 6.5 0 0 0 15.4 14M4.5 2.5V6h3.5M15.5 17.5V14H12",
  link: "M8.5 11.5a3 3 0 0 0 4.2 0l2.6-2.6a3 3 0 0 0-4.2-4.2L10 5.8M11.5 8.5a3 3 0 0 0-4.2 0l-2.6 2.6a3 3 0 0 0 4.2 4.2l1.1-1.1",
  external: "M8 4H4v12h12v-4M11 3.5h5.5V9M16.5 3.5 9 11",
  eye: "M1.5 10S4.5 4.5 10 4.5 18.5 10 18.5 10 15.5 15.5 10 15.5 1.5 10 1.5 10ZM10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  logout: "M8 3.5H4v13h4M12 6.5 15.5 10 12 13.5M15.5 10H7.5",
  "chevron-left": "M12 5.5 7.5 10l4.5 4.5",
  "chevron-up": "M5.5 12 10 7.5l4.5 4.5",
  "chevron-up-down": "M6.5 8 10 4.5 13.5 8M6.5 12l3.5 3.5 3.5-3.5",
  "arrow-left": "M16 10H4M8.5 5.5 4 10l4.5 4.5",
  "arrow-right": "M4 10h12M11.5 5.5 16 10l-4.5 4.5",
  info: "M10 17.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15ZM10 9v4.5M10 6.5h.01",
  "check-circle": "M10 17.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15ZM6.5 10l2.5 2.5 4.5-5",
  "x-circle": "M10 17.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15ZM7.5 7.5l5 5M12.5 7.5l-5 5",
  clock: "M10 17.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15ZM10 6v4l2.5 2.5",
  grid: "M3.5 3.5h5v5h-5v-5ZM11.5 3.5h5v5h-5v-5ZM3.5 11.5h5v5h-5v-5ZM11.5 11.5h5v5h-5v-5Z",
  list: "M7 5h10M7 10h10M7 15h10M3.5 5h.01M3.5 10h.01M3.5 15h.01",
  sidebar: "M3 4h14v12H3V4ZM7.5 4v12",
} as const;

export type IconName = keyof typeof paths;
export const iconNames = Object.keys(paths) as IconName[];

// Группы — для страницы «Фундамент → Иконки». Каждая иконка ровно в одной группе.
export const iconGroups: { title: string; icons: IconName[] }[] = [
  { title: "Разделы и объекты", icons: ["home", "receipt", "package", "tag", "layers", "users", "user", "percent", "store", "settings", "inbox", "briefcase", "folder", "image", "bell"] },
  { title: "Торговля и доставка", icons: ["truck", "credit-card", "euro", "globe", "map-pin", "calendar", "clock", "mail", "phone"] },
  { title: "Действия", icons: ["plus", "minus", "edit", "trash", "copy", "download", "upload", "archive", "refresh", "link", "external", "search", "filter", "sort", "eye", "logout", "more"] },
  { title: "Направление", icons: ["chevron-down", "chevron-up", "chevron-left", "chevron-right", "chevron-up-down", "arrow-left", "arrow-right"] },
  { title: "Состояние и вид", icons: ["check", "x", "alert", "info", "check-circle", "x-circle", "grid", "list", "sidebar"] },
];

export function Icon({ name, size = 20 }: { name: IconName; size?: number }): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor"
      strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={paths[name]} />
    </svg>
  );
}
