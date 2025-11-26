"use client"

import Link from "next/link"
import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "A bar chart showing favorite categories"

const chartConfig = {
    views: {
        label: "Views",
        color: "#C86F26",
    },
}

export function ChartBarDefault({ favoriteCategories = [] }) {
    // Transform favorite categories data for the chart
    const chartData = favoriteCategories.map(category => ({
        category: category.name,
        views: category.count
    }))

    // Calculate total views
    const totalViews = favoriteCategories.reduce((sum, cat) => sum + cat.count, 0)

    // Find the category with most views for the trending message
    const topCategory = favoriteCategories.length > 0 ? favoriteCategories[0] : null

    if (favoriteCategories.length === 0) {
        return (
            <Card className="rounded-lg border-gray-200 bg-white shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Your Favorite Categories</CardTitle>
                    <CardDescription className="text-xs">No data yet</CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                    <div className="h-[200px] flex items-center justify-center text-sm text-gray-500">
                        Start browsing books to see your favorite categories
                    </div>
                </CardContent>
                <CardFooter className="pb-3">
                    <Link
                        href="/student/books"
                        className="text-xs font-medium text-gray-600 hover:text-gray-900"
                    >
                        Browse catalog →
                    </Link>
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card className="rounded-lg border-gray-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-base">Your Favorite Categories</CardTitle>
                <CardDescription className="text-xs">Based on your browsing activity</CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
                <ChartContainer config={chartConfig} className="h-[200px] w-full aspect-auto">
                    <BarChart accessibilityLayer data={chartData} barCategoryGap="10%">
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="category"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value.length > 12 ? value.slice(0, 12) + '...' : value}
                            tick={{ fill: 'var(--text-primary)' }}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                            tick={{ fill: 'var(--text-primary)' }}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel className="bg-white" />}
                        />
                        <Bar dataKey="views" fill="var(--color-views)" radius={8} maxBarSize={90} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-1.5 text-xs pb-3">
                <div className="flex gap-2 leading-none font-medium">
                    {topCategory && `${topCategory.name} is your top interest`} <TrendingUp className="h-3.5 w-3.5" />
                </div>
                <div className="text-muted-foreground leading-none">
                    Total of {totalViews} views across {favoriteCategories.length} {favoriteCategories.length === 1 ? 'category' : 'categories'}
                </div>
            </CardFooter>
        </Card>
    )
}
