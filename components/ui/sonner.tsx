"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      icons={{
        success: <></>,
        info: <></>,
        warning: <></>,
        error: <></>,
        loading: <></>,
      }}
      style={
        {
          "--normal-bg": "#C9973A",
          "--normal-text": "#FFFFFF",
          "--normal-border": "transparent",
          "--border-radius": "9999px",
          "--toast-width": "auto",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "group !bg-gold !text-white !rounded-full !px-4 !py-1.5 !shadow-sm !font-medium !text-xs !border-0 flex justify-center items-center w-max mx-auto !min-h-0",
          title: "!text-white !font-medium",
          icon: "hidden",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
