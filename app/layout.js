import { Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "./../components/Navbar";
import Footer from "./../components/Footer";
import { AuthProvider } from "./Providers";

const inter = Poppins({ subsets: ["latin"], weight: ["400"] });

export const metadata = {
  title: "Chauff",
  description:
    "Chauff is your premier chauffeur service, offering luxurious transportation for all your needs. Whether you require airport transfers, corporate travel, or special events, our professional chauffeurs are dedicated to providing a first-class experience. With a fleet of top-of-the-line vehicles and unparalleled customer service, Chauff ensures a seamless journey from start to finish. Sit back, relax, and let Chauff take you where you need to go in style and comfort.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>

      <body className={inter.className}>
        <AuthProvider>
          <Navbar />
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
