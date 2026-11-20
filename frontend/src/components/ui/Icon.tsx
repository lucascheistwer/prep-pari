import type { SVGProps } from "react";

type IconName =
  | "home"
  | "book"
  | "calendar"
  | "basket"
  | "plus"
  | "search"
  | "heart"
  | "chevronLeft"
  | "chevronRight"
  | "check"
  | "close"
  | "camera"
  | "plate";

const paths: Record<IconName, string> = {
  home: "M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z",
  book: "M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21.5zM5 5.5V21.5M9 8h6",
  calendar:
    "M6 4v3M18 4v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z",
  basket: "M4 9h16l-1.2 10.2a1 1 0 0 1-1 .8H6.2a1 1 0 0 1-1-.8zM8 9l1.5-4h5L16 9",
  plus: "M12 6v12M6 12h12",
  search: "M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14zM20 20l-3.5-3.5",
  heart:
    "M12 19s-7-4.4-7-8.2A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.8C19 14.6 12 19 12 19z",
  chevronLeft: "M14 6 8 12l6 6",
  chevronRight: "M10 6l6 6-6 6",
  check: "M5 12.5 9.2 17 19 7",
  close: "M7 7l10 10M17 7 7 17",
  camera:
    "M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zM12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  plate: "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
};

export function Icon({
  name,
  className = "size-5",
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
