"use client"

import { useState, useEffect } from "react"
import type { NewsItem } from "@/types/news"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"

interface TimelineProps {
  timelineDate: string
  setTimelineDate: (date: string) => void
  news: NewsItem[]
}

export default function Timeline({ timelineDate, setTimelineDate, news }: TimelineProps) {
  const [timelineData, setTimelineData] = useState<{ date: string; count: number }[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Generate timeline data
  useEffect(() => {
    // In a real app, you would aggregate news by date
    // For demo purposes, we'll create mock timeline data
    const dates = [
      { date: "2021-01-01", count: 5 },
      { date: "2021-01-05", count: 8 },
      { date: "2021-01-10", count: 12 },
      { date: "2021-01-15", count: 7 },
      { date: "2021-01-20", count: 10 },
      { date: "2021-01-25", count: 6 },
      { date: "2021-02-01", count: 9 },
      { date: "2021-02-05", count: 11 },
      { date: "2021-02-10", count: 4 },
      { date: "2021-02-15", count: 8 },
      { date: "2021-02-20", count: 13 },
      { date: "2021-02-25", count: 7 },
      { date: "2021-03-01", count: 10 },
      { date: "2021-03-05", count: 6 },
      { date: "2021-03-10", count: 9 },
      { date: "2021-03-15", count: 12 },
      { date: "2021-03-20", count: 8 },
      { date: "2021-03-25", count: 5 },
      { date: "2021-04-01", count: 11 },
      { date: "2021-04-05", count: 7 },
    ]

    setTimelineData(dates)

    // Find index of current date
    const index = dates.findIndex((d) => d.date === timelineDate)
    if (index !== -1) {
      setSelectedIndex(index)
    }
  }, [news, timelineDate])

  const handleTimelineClick = (date: string, index: number) => {
    setTimelineDate(date)
    setSelectedIndex(index)
  }

  const formatDateRange = () => {
    if (timelineData.length === 0) return ""

    const startDate = new Date(timelineData[0].date)
    const endDate = new Date(timelineData[timelineData.length - 1].date)

    return `${startDate.toLocaleDateString()} — ${endDate.toLocaleDateString()}`
  }

  return (
    <div className="bg-[#1e2130] text-white p-4 rounded-md">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="text-sm">DateTime</span>
        </div>
        <div className="text-sm font-medium">{formatDateRange()}</div>
        <div className="flex gap-1">
          <button className="p-1 rounded-full hover:bg-gray-700">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button className="p-1 rounded-full hover:bg-gray-700">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="h-32 flex items-end gap-1">
        {timelineData.map((item, index) => {
          // Calculate height based on count (max height is 100%)
          const maxCount = Math.max(...timelineData.map((d) => d.count))
          const height = `${(item.count / maxCount) * 100}%`

          return (
            <div
              key={item.date}
              className={`w-3 cursor-pointer transition-all ${
                index === selectedIndex ? "bg-[#36c9c9]" : "bg-gray-500 hover:bg-[#36c9c9]"
              }`}
              style={{ height }}
              onClick={() => handleTimelineClick(item.date, index)}
              title={`${item.date}: ${item.count} news items`}
            />
          )
        })}
      </div>

      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>1970</span>
        <span>1980</span>
        <span>1990</span>
        <span>2000</span>
        <span>2010</span>
        <span>2020</span>
      </div>
    </div>
  )
}
