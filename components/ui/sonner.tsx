"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        [data-sonner-toaster][data-x-position="center"] {
          left: 50% !important;
          transform: translateX(-50%) !important;
          width: fit-content !important;
          max-width: min(85vw, 420px) !important;
        }
        [data-sonner-toaster] [data-sonner-toast] {
          width: fit-content !important;
          min-width: 0 !important;
          max-width: min(85vw, 420px) !important;
          padding: 8px 20px !important;
          border-radius: 9999px !important;
          border: none !important;
          background: #C9973A !important;
          color: #fff !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          line-height: 1.4 !important;
          white-space: nowrap !important;
          text-align: center !important;
          box-shadow: 0 4px 16px rgba(201,151,58,0.35), 0 1px 3px rgba(0,0,0,0.12) !important;
          cursor: default !important;
          user-select: none !important;
          min-height: 0 !important;
          height: auto !important;
        }
        [data-sonner-toaster] [data-sonner-toast] [data-title] {
          color: #fff !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          white-space: nowrap !important;
        }
        [data-sonner-toaster] [data-sonner-toast] [data-icon] {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
          margin: 0 !important;
        }
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-6px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        [data-sonner-toaster] [data-sonner-toast] {
          animation: toast-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}} />

      <Sonner
        theme={theme as ToasterProps["theme"]}
        className="toaster"
        position="top-center"
        offset={64}
        visibleToasts={1}
        icons={{ success: null, info: null, warning: null, error: null, loading: null }}
        style={{ "--toast-width": "fit-content" } as React.CSSProperties}
        toastOptions={{
          duration: 2000,
          classNames: {
            toast: "!bg-[#C9973A] !text-white !rounded-full !border-0",
            title: "!text-white !font-medium",
            icon: "!hidden !w-0 !h-0 !m-0 !p-0",
          },
        }}
        {...props}
      />
    </>
  )
}

export { Toaster }