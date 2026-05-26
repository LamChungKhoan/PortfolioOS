import * as React from "react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-lg border border-slate-800 bg-[#0c0c0e] text-slate-300 shadow-sm flex flex-col", className)} {...props} />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1 p-4", className)} {...props} />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("text-[10px] uppercase font-bold text-slate-500 tracking-wider leading-none", className)} {...props} />
))
CardTitle.displayName = "CardTitle"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 pt-0 flex-1 flex flex-col", className)} {...props} />
))
CardContent.displayName = "CardContent"

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' | 'ghost' | 'secondary', size?: 'default' | 'sm' | 'lg' | 'icon' }>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            'bg-slate-100 text-slate-900 hover:bg-slate-200': variant === 'default',
            'border text-slate-100 border-slate-800 bg-transparent hover:bg-slate-800 hover:text-slate-50': variant === 'outline',
            'hover:bg-slate-800 hover:text-slate-50 text-slate-400': variant === 'ghost',
            'bg-slate-800 text-slate-100 hover:bg-slate-700': variant === 'secondary',
            'h-10 px-4 py-2': size === 'default',
            'h-9 rounded-md px-3': size === 'sm',
            'h-11 rounded-md px-8': size === 'lg',
            'h-10 w-10': size === 'icon',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

const Badge = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' }>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div ref={ref} className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-slate-800 text-slate-400": variant === "default",
          "border-transparent bg-slate-800/50 text-slate-300 hover:bg-slate-700/50": variant === "secondary",
          "border-transparent bg-rose-500/10 text-rose-400 border-rose-900/50": variant === "destructive",
          "border-transparent bg-emerald-500/10 text-emerald-500 border-emerald-900/50": variant === "success",
          "text-slate-300 border border-slate-700 bg-slate-900": variant === "outline",
        },
        className
      )} {...props} />
    )
  }
)
Badge.displayName = "Badge"

export { Card, CardHeader, CardTitle, CardContent, Button, Badge }
