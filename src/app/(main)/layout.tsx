import "@once-ui-system/core/css/styles.css";
import "@once-ui-system/core/css/tokens.css";
import "@/resources/custom.css";

import classNames from "classnames";

import { baseURL, meta } from "@/resources/seo";
import { fonts, style, dataStyle } from "@/resources/once-ui.config";
import { Meta, Column, Flex, ThemeInit } from "@once-ui-system/core";
import { Providers } from "@/components/Providers";
import { AppHeader, BottomNav } from "@/components/shell";

export async function generateMetadata() {
  return Meta.generate({
    title: meta.home.title,
    description: meta.home.description,
    baseURL: baseURL,
    path: meta.home.path,
    robots: meta.home.robots,
  });
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Flex
      suppressHydrationWarning
      as="html"
      lang="en"
      fillWidth
      className={classNames(
        fonts.heading.variable,
        fonts.body.variable,
        fonts.label.variable,
        fonts.code.variable,
      )}
    >
      <head>
        <ThemeInit
          config={{
            theme: style.theme,
            brand: style.brand,
            accent: style.accent,
            neutral: style.neutral,
            solid: style.solid,
            "solid-style": style.solidStyle,
            border: style.border,
            surface: style.surface,
            transition: style.transition,
            scaling: style.scaling,
            "viz-style": dataStyle.variant,
          }}
        />
      </head>
      <Providers>
        <Column as="body" background="page" fillWidth minHeight="100dvh" margin="0" padding="0">
          <AppHeader />
          <Column
            as="main"
            fillWidth
            horizontal="center"
            paddingX="l"
            paddingBottom="64"
            s={{ paddingX: "16", style: { paddingBottom: "6rem" } }}
          >
            {children}
          </Column>
          <BottomNav />
        </Column>
      </Providers>
    </Flex>
  );
}
