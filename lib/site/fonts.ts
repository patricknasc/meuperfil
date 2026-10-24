import { Bricolage_Grotesque, Inter } from "next/font/google";

/** Display face for headlines on the public site. */
export const displayFont = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "swap",
});

/** Body face for the public site. */
export const bodyFont = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
  display: "swap",
});

export const siteFontVariables = `${displayFont.variable} ${bodyFont.variable}`;
