import type { Metadata } from "next";
import { Anton, Archivo, Pinyon_Script } from "next/font/google";
import Nav from "@/components/Nav";
import { PageTransitionProvider } from "@/components/PageTransition";
import SmoothScroll from "@/components/SmoothScroll";
import "./globals.css";

const anton = Anton({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const pinyonScript = Pinyon_Script({
  variable: "--font-script",
  subsets: ["latin"],
  weight: "400",
});

const archivo = Archivo({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Taiwo Adeoshun",
  description: "Fashion Design, Styling and Modeling by Taiwo Adeoshun.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${pinyonScript.variable} ${archivo.variable}`}
    >
      {/* Browser extensions (e.g. ColorZilla) add attributes to <body> before hydration. */}
      <body suppressHydrationWarning>
        <SmoothScroll>
          <PageTransitionProvider>
            <Nav />
            {children}
          </PageTransitionProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
