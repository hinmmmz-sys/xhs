"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart3, RefreshCw } from "lucide-react";
import { getBusinessOverview } from "@/lib/api";
import type { BusinessOverview as BusinessOverviewData } from "@/lib/types";
import DateRangeSelector from "./DateRangeSelector";
import MetricCard from "./MetricCard";
import TrendChart from "./TrendChart";
import ChannelDetailCard from "./ChannelDetailCard";

export default function BusinessOverview() {
  const [data, setData] = useState<BusinessOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7d");

  const loadData = useCallback(async (range: string) => {
    setLoading(true);
    try {
      const overview = await getBusinessOverview(range);
      setData(overview);
    } catch (err) {
      console.error("获取经营概览失败:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData(dateRange);
  }, [dateRange, loadData]);

  return (
    <div className="space-y-5">
      {/* Header with date range selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-bold text-gray-800">经营概览</h2>
          {data && (
            <span className="text-sm text-gray-400">· {data.date_range_label}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          <button
            onClick={() => loadData(dateRange)}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          加载中...
        </div>
      ) : !data ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400">
          暂无数据
        </div>
      ) : (
        <>
          {/* Metric cards - 7个核心指标 */}
          <div className="grid grid-cols-4 gap-4">
            <MetricCard metric={data.total_payment} />
            <MetricCard metric={data.exposure_count} />
            <MetricCard metric={data.click_payment_rate} />
            <MetricCard metric={data.refund_amount} />
            <MetricCard metric={data.order_count} />
            <MetricCard metric={data.visitor_count} />
            <MetricCard metric={data.favorite_cart_count} />
          </div>

          {/* Trend chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">趋势分析</h3>
            <TrendChart data={data.trend} />
          </div>

          {/* Channel details */}
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-4">渠道自营详情</h3>
            <div className="grid grid-cols-2 gap-4">
              <ChannelDetailCard channel={data.live_streaming} icon="live" />
              <ChannelDetailCard channel={data.short_video} icon="video" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
