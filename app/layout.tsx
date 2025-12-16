import type { Metadata } from "next";
import "./globals.css";
import StyledComponentsRegistry from "@/lib/registry";
import { Win95Provider } from "@/components/Win95Provider";
import { MCPProvider } from "@/contexts/mcp-context";

export const metadata: Metadata = {
  title: "AI Chat - Windows 95 Edition",
  description: "Retro AI Chat Interface with MCP Support",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <StyledComponentsRegistry>
          <Win95Provider>
            <MCPProvider>
              {children}
            </MCPProvider>
          </Win95Provider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
