import { createId } from "@paralleldrive/cuid2";
import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const createPrefixId = (prefix: string) => {
  return `${prefix}_${createId()}`;
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
