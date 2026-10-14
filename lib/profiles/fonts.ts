import { Inter, Lora, Montserrat, Playfair_Display, Poppins, Space_Grotesk } from "next/font/google";

// preload: false — each @font-face only downloads when a profile uses it.
const inter = Inter({ subsets: ["latin"], variable: "--mp-font-inter", display: "swap", preload: false });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--mp-font-poppins",
  display: "swap",
  preload: false,
});
const montserrat = Montserrat({ subsets: ["latin"], variable: "--mp-font-montserrat", display: "swap", preload: false });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--mp-font-playfair", display: "swap", preload: false });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--mp-font-space", display: "swap", preload: false });
const lora = Lora({ subsets: ["latin"], variable: "--mp-font-lora", display: "swap", preload: false });

/** Add to the element that renders a profile so the font variables exist. */
export const profileFontVariables = [inter, poppins, montserrat, playfair, spaceGrotesk, lora]
  .map((font) => font.variable)
  .join(" ");
