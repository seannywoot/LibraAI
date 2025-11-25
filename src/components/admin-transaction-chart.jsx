"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const chartConfig = {
  active: {
    label: "Active",
    color: "hsl(142, 76%, 36%)",
  },
  totalBorrowed: {
    label: "Total Borrowed",
    color: "hsl(280, 76%, 56%)",
  },
  returned: {
    label: "Returned",
    color: "hsl(221, 83%, 53%)",
  },
  requests: {
    label: "Requests",
    color: "hsl(48, 96%, 53%)",
  },
}

export function AdminTransactionChart({ data = [] }) {
  const [timeRange, setTimeRange] = React.useState("30d")

  const filteredData = React.useMemo(() => {
    if (!data || data.length === 0) return []

    const now = new Date()
    let daysToSubtract = 30

    if (timeRange === "90d") {
      daysToSubtract = 90
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }

    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - daysToSubtract)

    return data.filter((item) => {
      const date = new Date(item.date)
      return date >= startDate
    })
  }, [data, timeRange])

  const totalActive = React.useMemo(() => {
    // Get the most recent active value (currently borrowed books)
    if (filteredData.length === 0) return 0
    return filteredData[filteredData.length - 1]?.active || 0
  }, [filteredData])

  const totalBorrowed = React.useMemo(() => {
    // Sum of daily borrow counts
    return filteredData.reduce((sum, item) => sum + (item.totalBorrowed || 0), 0)
  }, [filteredData])

  const totalReturned = React.useMemo(() => {
    return filteredData.reduce((sum, item) => sum + (item.returned || 0), 0)
  }, [filteredData])

  const totalRequests = React.useMemo(() => {
    return filteredData.reduce((sum, item) => sum + (item.requests || 0), 0)
  }, [filteredData])

  if (!data || data.length === 0) {
    return (
      <Card className="pt-0">
        <CardHeader className="border-b py-5">
          <CardTitle>Transaction Trends</CardTitle>
          <CardDescription>No transaction data available</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pt-6">
          <div className="flex h-[250px] items-center justify-center text-sm text-zinc-500">
            No data to display
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Transaction Trends</CardTitle>
          <CardDescription>
            Active: {totalActive} • Total Borrowed: {totalBorrowed} • Returned: {totalReturned} • Requests: {totalRequests}
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Last 30 days" />
          </SelectTrigger>
          <SelectContent className="rounded-xl bg-white border-gray-200">
            <SelectItem value="90d" className="rounded-lg">
              Last 90 days
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Last 7 days
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6 overflow-hidden">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillActive" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-active)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-active)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillTotalBorrowed" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-totalBorrowed)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-totalBorrowed)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillReturned" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-returned)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-returned)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillRequests" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-requests)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-requests)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={20}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  className="bg-white border-gray-200"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="totalBorrowed"
              type="natural"
              fill="url(#fillTotalBorrowed)"
              stroke="var(--color-totalBorrowed)"
              fillOpacity={0.6}
            />
            <Area
              dataKey="active"
              type="natural"
              fill="url(#fillActive)"
              stroke="var(--color-active)"
              fillOpacity={0.6}
            />
            <Area
              dataKey="returned"
              type="natural"
              fill="url(#fillReturned)"
              stroke="var(--color-returned)"
              fillOpacity={0.6}
            />
            <Area
              dataKey="requests"
              type="natural"
              fill="url(#fillRequests)"
              stroke="var(--color-requests)"
              fillOpacity={0.6}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
