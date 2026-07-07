"use client";

import { useState, useEffect } from "react";
import { Save, CheckCircle, Key, Mail, Sliders, Sparkles } from "lucide-react";
import { getSettings, updateSettings } from "@/lib/api";
import type { SettingsResponse, SettingsUpdate } from "@/lib/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<SettingsUpdate>({});

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getSettings();
        setSettings(data);
        setForm({
          minimax_model: data.minimax_model,
          smtp_host: data.smtp_host,
          smtp_port: data.smtp_port,
          email_from: data.email_from,
          email_to: data.email_to,
          inventory_low_stock_days: data.inventory_low_stock_days,
          ad_waste_min_spend: data.ad_waste_min_spend,
          keyword_low_conv_min_clicks: data.keyword_low_conv_min_clicks,
          conversion_drop_threshold: data.conversion_drop_threshold,
          negative_review_max_rating: data.negative_review_max_rating,
        });
      } catch {
        // ignore
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const result = await updateSettings(form);
      const newSettings = await getSettings();
      setSettings(newSettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // ignore
    }
    setSaving(false);
  };

  const update = (key: keyof SettingsUpdate, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="p-8 text-center py-20 text-gray-400">加载中...</div>;
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">设置</h1>
        <p className="text-sm text-gray-500 mt-1">配置 AI、邮件通知和规则引擎阈值</p>
      </div>

      {/* Status badges */}
      <div className="flex gap-3 mb-6">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
          settings?.has_minimax ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
        }`}>
          <Sparkles className="w-4 h-4" />
          MiniMax: {settings?.has_minimax ? "已配置" : "未配置"}
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
          settings?.has_smtp ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
        }`}>
          <Mail className="w-4 h-4" />
          SMTP: {settings?.has_smtp ? "已配置" : "未配置"}
        </div>
      </div>

      {/* MiniMax AI */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h2 className="text-lg font-semibold text-gray-800">MiniMax AI</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">API Key</label>
            <input
              type="password"
              placeholder="sk-api-..."
              value={form.minimax_api_key || ""}
              onChange={(e) => update("minimax_api_key", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              在 platform.minimaxi.com 获取 API Key。用于 AI 生成晨报总结，未配置时使用模板降级。
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">模型</label>
            <select
              value={form.minimax_model || "MiniMax-M3"}
              onChange={(e) => update("minimax_model", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              <option value="MiniMax-M3">MiniMax-M3（推荐，最强推理）</option>
              <option value="MiniMax-M2.7">MiniMax-M2.7（高性价比）</option>
              <option value="MiniMax-M2.5">MiniMax-M2.5（快速版）</option>
            </select>
          </div>
        </div>
      </div>

      {/* SMTP */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-800">邮件通知</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">SMTP 服务器</label>
            <input
              type="text"
              value={form.smtp_host || ""}
              onChange={(e) => update("smtp_host", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">端口</label>
            <input
              type="number"
              value={form.smtp_port || ""}
              onChange={(e) => update("smtp_port", parseInt(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">SMTP 用户名</label>
            <input
              type="text"
              value={form.smtp_user || ""}
              onChange={(e) => update("smtp_user", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">SMTP 密码</label>
            <input
              type="password"
              value={form.smtp_password || ""}
              onChange={(e) => update("smtp_password", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">发件人邮箱</label>
            <input
              type="email"
              value={form.email_from || ""}
              onChange={(e) => update("email_from", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">收件人邮箱</label>
            <input
              type="email"
              value={form.email_to || ""}
              onChange={(e) => update("email_to", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Thresholds */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Sliders className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-gray-800">规则引擎阈值</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">库存预警天数</label>
            <input
              type="number"
              value={form.inventory_low_stock_days || ""}
              onChange={(e) => update("inventory_low_stock_days", parseInt(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">可售天数低于此值触发预警</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">广告无效花费阈值 ($)</label>
            <input
              type="number"
              step="0.01"
              value={form.ad_waste_min_spend || ""}
              onChange={(e) => update("ad_waste_min_spend", parseFloat(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">花费超过此值且 0 订单触发预警</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">关键词低转化点击数</label>
            <input
              type="number"
              value={form.keyword_low_conv_min_clicks || ""}
              onChange={(e) => update("keyword_low_conv_min_clicks", parseInt(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">点击超过此值且 0 订单触发预警</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">转化率下降阈值 (%)</label>
            <input
              type="number"
              step="0.1"
              value={form.conversion_drop_threshold || ""}
              onChange={(e) => update("conversion_drop_threshold", parseFloat(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">下降幅度超过此值触发（负数，如 -20）</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">差评最大评分</label>
            <input
              type="number"
              value={form.negative_review_max_rating || ""}
              onChange={(e) => update("negative_review_max_rating", parseInt(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">评分低于等于此值触发差评预警</p>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? "保存中..." : "保存设置"}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-green-600 text-sm">
            <CheckCircle className="w-4 h-4" />
            保存成功
          </span>
        )}
      </div>
    </div>
  );
}
