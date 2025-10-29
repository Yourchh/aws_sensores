import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: string
  icon: LucideIcon
  trend?: {
    icon: LucideIcon
    color: string
    text: string
  }
  subtitle?: string
  color: "orange" | "blue" | "green" | "yellow"
}

const colorClasses = {
  orange: {
    bg: "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900",
    border: "border-orange-200 dark:border-orange-800",
    icon: "text-orange-600 dark:text-orange-400",
    text: "text-orange-900 dark:text-orange-100",
    subtitle: "text-orange-700 dark:text-orange-300",
  },
  blue: {
    bg: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900",
    border: "border-blue-200 dark:border-blue-800",
    icon: "text-blue-600 dark:text-blue-400",
    text: "text-blue-900 dark:text-blue-100",
    subtitle: "text-blue-700 dark:text-blue-300",
  },
  green: {
    bg: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900",
    border: "border-green-200 dark:border-green-800",
    icon: "text-green-600 dark:text-green-400",
    text: "text-green-900 dark:text-green-100",
    subtitle: "text-green-700 dark:text-green-300",
  },
  yellow: {
    bg: "bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900",
    border: "border-yellow-200 dark:border-yellow-800",
    icon: "text-yellow-600 dark:text-yellow-400",
    text: "text-yellow-900 dark:text-yellow-100",
    subtitle: "text-yellow-700 dark:text-yellow-300",
  },
}

export function MetricCard({ title, value, icon: Icon, trend, subtitle, color }: MetricCardProps) {
  const colors = colorClasses[color]
  const TrendIcon = trend?.icon

  return (
    <Card className={cn(colors.bg, colors.border)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className={cn("text-sm font-medium", colors.text)}>{title}</p>
            <p className={cn("text-2xl font-bold", colors.text)}>{value}</p>
            {subtitle && <p className={cn("text-xs", colors.subtitle)}>{subtitle}</p>}
          </div>
          <Icon className={cn("h-8 w-8", colors.icon)} />
        </div>
        {trend && TrendIcon && (
          <div className={cn("flex items-center gap-1 mt-3 text-xs", trend.color)}>
            <TrendIcon className="h-3 w-3" />
            <span>{trend.text}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
