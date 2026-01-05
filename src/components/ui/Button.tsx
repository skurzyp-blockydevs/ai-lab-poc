import * as React from "react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

const buttonVariants = {
    variants: {
        variant: {
            default: "bg-primary text-primary-foreground hover:bg-primary/90",
            destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            ghost: "hover:bg-accent hover:text-accent-foreground",
            link: "text-primary underline-offset-4 hover:underline",
            solidPrimary: "bg-primary text-white hover:bg-primary/90",
        },
        size: {
            default: "h-10 px-4 py-2",
            sm: "h-9 rounded-md px-3",
            lg: "h-11 rounded-md px-8",
            icon: "h-10 w-10",
            md: "h-10 px-4 py-2", // Added to match Vue props
        },
    },
    defaultVariants: {
        variant: "default",
        size: "default",
    },
}

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: keyof typeof buttonVariants.variants.variant
    size?: keyof typeof buttonVariants.variants.size
    loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", loading = false, children, ...props }, ref) => {
        // Basic implementation of cva logic without installing cva
        const variantClass = buttonVariants.variants.variant[variant] || buttonVariants.variants.variant.default
        const sizeClass = buttonVariants.variants.size[size] || buttonVariants.variants.size.default

        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                    variantClass,
                    sizeClass,
                    className
                )}
                disabled={loading || props.disabled}
                {...props}
            >
                {loading && <span className="mr-2 animate-spin">⏳</span>}
                {children}
            </button>
        )
    }
)
Button.displayName = "Button"

export default Button
