import "./globals.css";

export const metadata = {
  title: "AI Yield Optimizer",
  description: "Automated yield rebalancing for WBTC.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
