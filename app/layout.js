import { IBM_Plex_Mono, Instrument_Serif } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Footer from "./../components/Footer";
import ImgniIdentify from "./../components/ImgniIdentify";
import { AuthProvider } from "./Providers";

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-instrument-serif",
});

export const metadata = {
  title: "Chauff",
  description:
    "Chauff is your premier chauffeur service, offering luxurious transportation for all your needs. Whether you require airport transfers, corporate travel, or special events, our professional chauffeurs are dedicated to providing a first-class experience. With a fleet of top-of-the-line vehicles and unparalleled customer service, Chauff ensures a seamless journey from start to finish. Sit back, relax, and let Chauff take you where you need to go in style and comfort.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>

      <body
        className={`${ibmPlexMono.variable} ${instrumentSerif.variable} font-body`}
      >
        <AuthProvider>
          <ImgniIdentify />
          {children}
          <Footer />
        </AuthProvider>
        <Script
          id="sienna-config"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.IMGNI_CONFIG = { projectId: "cmrtryjk60001s60pqf73ljyf" };`,
          }}
        />
        <Script
          src="https://imgnilabs.com/widget.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
