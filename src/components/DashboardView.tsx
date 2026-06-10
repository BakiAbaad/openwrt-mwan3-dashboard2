/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity, Wifi, WifiOff, AlertTriangle, ArrowUpDown, ChevronDown, 
  ChevronUp, Sliders, RefreshCw, Layers, ShieldCheck, Play, 
  Square, RefreshCcw, Download, Upload, Cpu, Eye, EyeOff, Check
} from 'lucide-react';
import { NetworkInterface, AlertLog, DashboardWidget, SystemMetrics, UserRole } from '../types';

interface DashboardViewProps {
  interfaces: NetworkInterface[];
  setInterfaces: React.Dispatch<React.SetStateAction<NetworkInterface[]>>;
  alerts: AlertLog[];
  setAlerts: React.Dispatch<React.SetStateAction<AlertLog[]>>;
  widgets: DashboardWidget[];
  setWidgets: React.Dispatch<React.SetStateAction<DashboardWidget[]>>;
  metrics: SystemMetrics;
  setMetrics: React.Dispatch<React.SetStateAction<SystemMetrics>>;
  role: UserRole;
  onTriggerNotification: (message: string, level: 'info' | 'warning' | 'error') => void;
}

export default function DashboardView({
  interfaces,
  setInterfaces,
  alerts,
  setAlerts,
  widgets,
  setWidgets,
  metrics,
  setMetrics,
  role,
  onTriggerNotification
}: DashboardViewProps) {
  // Local active stats & configuration changes
  const [activeTab, setActiveTab] = useState<'all' | 'wan1' | 'wan2' | 'lte'>('all');
  const [isSimulatingTraffic, setIsSimulatingTraffic] = useState(true);
  const [reportFilter, setReportFilter] = useState<'all' | 'info' | 'warning' | 'error'>('all');
  const [selectedWeightId, setSelectedWeightId] = useState<string | null>(null);

  // Real-time speed oscillations
  useEffect(() => {
    if (!isSimulatingTraffic) return;

    const interval = setInterval(() => {
      // 1. Oscillate speeds on active/online interfaces
      setInterfaces(prev => prev.map(inf => {
        if (!inf.enabled || inf.status === 'offline') {
          return { ...inf, speedUp: 0, speedDown: 0 };
        }
        
        const baseDown = inf.type === 'fiber' ? 150 : inf.type === 'dsl' ? 35 : inf.type === 'lte' ? 12 : 80;
        const baseUp = inf.type === 'fiber' ? 40 : inf.type === 'dsl' ? 8 : inf.type === 'lte' ? 4 : 20;

        // Random small variation (+/- 15%)
        const varDown = baseDown * (0.85 + Math.random() * 0.3);
        const varUp = baseUp * (0.85 + Math.random() * 0.3);

        // Degradation adjustment
        const factor = inf.status === 'degraded' ? 0.3 : 1;

        // Slow updates of uptime
        return {
          ...inf,
          speedDown: Number((varDown * factor).toFixed(1)),
          speedUp: Number((varUp * factor).toFixed(1)),
          uptime: inf.uptime + 2
        };
      }));

      // 2. Oscillate router CPU usage and active connections
      setMetrics(prev => {
        const cpuOffset = (Math.random() - 0.5) * 5; // offset of up to +/- 2.5%
        const activeConnOffset = Math.floor((Math.random() - 0.5) * 40); // +/- 20 connections
        return {
          ...prev,
          cpuUsage: Math.max(5, Math.min(95, Number((prev.cpuUsage + cpuOffset).toFixed(1)))),
          activeConnections: Math.max(50, prev.activeConnections + activeConnOffset),
          mwan3Uptime: prev.mwan3Uptime + 2
        };
      });

    }, 2000);

    return () => clearInterval(interval);
  }, [isSimulatingTraffic]);

  // Calculate dynamic traffic distribution ratios based on WEIGHTS of ONLINE interfaces
  const getTrafficDistribution = () => {
    const onlineInterfaces = interfaces.filter(inf => inf.enabled && inf.status !== 'offline');
    
    if (onlineInterfaces.length === 0) return [];

    // Prioritize by metric (lower metric = higher priority)
    // Find min metric among active
    const minActiveMetric = Math.min(...onlineInterfaces.map(i => i.priority));
    const activeInLowestMetric = onlineInterfaces.filter(i => i.priority === minActiveMetric);

    const totalWeight = activeInLowestMetric.reduce((sum, inf) => sum + inf.weight, 0);

    if (totalWeight === 0) return [];

    return activeInLowestMetric.map(inf => ({
      id: inf.id,
      name: inf.name,
      percentage: Math.round((inf.weight / totalWeight) * 100),
      color: inf.type === 'fiber' ? '#10B981' : inf.type === 'dsl' ? '#3B82F6' : '#F59E0B'
    }));
  };

  const trafficDist = getTrafficDistribution();

  // Handle widget visibility toggle
  const toggleWidget = (id: string) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
  };

  // Move widget order up or down
  const moveWidget = (id: string, dir: 'up' | 'down') => {
    const sorted = [...widgets].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(w => w.id === id);
    if (idx === -1) return;

    if (dir === 'up' && idx > 0) {
      // Swap order value
      const tempOrder = sorted[idx].order;
      sorted[idx].order = sorted[idx - 1].order;
      sorted[idx - 1].order = tempOrder;
    } else if (dir === 'down' && idx < sorted.length - 1) {
      const tempOrder = sorted[idx].order;
      sorted[idx].order = sorted[idx + 1].order;
      sorted[idx + 1].order = tempOrder;
    }
    setWidgets(sorted);
  };

  // Simulate server outage toggles
  const toggleInterfaceStatus = (id: string, forceOffline?: boolean) => {
    if (role === 'viewer') {
      alert('طلب مرفوض: صلاحية المشغل (Operator) أو مدير النظام (Administrator) مطلوبة للتحكم بالاتصالات ومحاكاة الأعطال.');
      return;
    }

    setInterfaces(prev => prev.map(inf => {
      if (inf.id === id) {
        const isCurrentlyOffline = inf.status === 'offline';
        const targetOffline = forceOffline !== undefined ? forceOffline : !isCurrentlyOffline;
        const nextStatus = targetOffline ? 'offline' : (inf.type === 'lte' ? 'degraded' : 'online');
        
        // Spawn alert log
        const timestamp = new Date().toISOString();
        const notificationMsg = targetOffline 
          ? `❌ خطأ كارثي: واجهة الاتصال الرئيسية [${inf.name}] خرجت من الخدمة بالكامل لعدم استجابة البوابة.`
          : `✅ عودة خط الاتصال: واجهة [${inf.name}] استردت اتصالها بامتياز وتم ضمها مجدداً لشبكة الموازنة.`;
        
        setAlerts(oldAlerts => [
          {
            id: `alert_${Date.now()}`,
            timestamp,
            level: targetOffline ? 'error' : 'info',
            interfaceId: id,
            message: notificationMsg,
            resolved: !targetOffline
          },
          ...oldAlerts
        ]);

        onTriggerNotification(notificationMsg, targetOffline ? 'error' : 'info');

        return {
          ...inf,
          status: nextStatus as any,
          uptime: targetOffline ? 0 : 30 // reset uptime on disconnect
        };
      }
      return inf;
    }));
  };

  const handleApplyWeightChange = (id: string, weightVal: number) => {
    if (role === 'viewer') {
      alert('الصفة مراجع لا تخولك لإجراء تعديلات.');
      return;
    }
    setInterfaces(prev => prev.map(t => t.id === id ? { ...t, weight: weightVal } : t));
    setSelectedWeightId(null);
    onTriggerNotification(`تمت إعادة جدولة الأوزان للمنفذ ${id} لتصبح النسبة ${weightVal}.`, 'info');
  };

  const getSystemHealth = () => {
    const totalLines = interfaces.filter(i => i.enabled).length;
    const onlineLines = interfaces.filter(i => i.enabled && i.status === 'online').length;
    const degradedLines = interfaces.filter(i => i.enabled && i.status === 'degraded').length;

    if (onlineLines === totalLines) return { percent: 100, label: 'مثالي (Excellent)', color: 'text-emerald-500' };
    if (onlineLines + degradedLines === totalLines) return { percent: 80, label: 'مستقر (Stable)', color: 'text-blue-500' };
    if (onlineLines > 0) return { percent: 50, label: 'شبكة جزئية (Warning)', color: 'text-yellow-500' };
    return { percent: 0, label: 'انقطاع كامل (Critical Outage)', color: 'text-rose-500' };
  };

  const health = getSystemHealth();

  // Export mock report
  const exportReport = (format: 'csv' | 'json') => {
    let output = '';
    if (format === 'json') {
      output = JSON.stringify({
        generated_at: new Date().toISOString(),
        overall_health: health.percent,
        interfaces: interfaces,
        alerts: alerts
      }, null, 2);
    } else {
      output = "المنفذ,الحالة,السرعة (ميجابت/ثانية),الكمون (ملي ثانية),الوزن\n" + 
               interfaces.map(i => `${i.name},${i.status},${i.speedDown},${i.latency}ms,${i.weight}`).join('\n');
    }

    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mwan3_report_${new Date().toISOString().substring(0,10)}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onTriggerNotification('تم استخراج ملف تقرير جودة الاتصال وتنزيله بنجاح.', 'info');
  };

  return (
    <div className="space-y-6" id="dashboard_view_panel">
      {/* Network Overview Bar Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Core Router Status */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-xs border border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 dark:text-slate-400 font-semibold block">الحالة العامة للموازنة</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${health.percent > 49 ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
              <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">{health.label}</h3>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Wifi className="w-6 h-6" />
          </div>
        </div>

        {/* Global Traffic Split Weight */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-xs border border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 dark:text-slate-400 font-semibold block">درجة الكفاءة الأمنية للراوتر</span>
            <h3 className="text-base sm:text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
              {health.percent}% <span className="text-xs text-slate-400 font-normal">جاهزية كاملة</span>
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Active Streams */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-xs border border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 dark:text-slate-400 font-semibold block">جلسات الاتصال الفعالة (TCP/UDP)</span>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-white">
              {metrics.activeConnections.toLocaleString()} <span className="text-xs text-slate-400 font-normal">خط تدفق</span>
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-300 flex items-center justify-center">
            <ArrowUpDown className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Total Speed Meter Summarizer */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-xs border border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 dark:text-slate-400 font-semibold block">مجموع تتبع التحميل الحالي</span>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <Download className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                {interfaces.reduce((sum, inf) => sum + (inf.status !== 'offline' ? inf.speedDown : 0), 0).toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-400 font-normal">MB/s</span>
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Widget Layout Customizer Toggle (Expandable Settings Drawer link) */}
      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4.5 border border-slate-150 dark:border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">تخصيص وترتيب لوحة القيادة الذكية (Widget Customizer)</h4>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">تبديل ظهور وترتيب عناصر واجهة الإدارة لتلائم سعة شاشتك ومتطلبات الإشراف للشبكة.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {widgets.map(w => (
            <button
              key={w.id}
              onClick={() => toggleWidget(w.id)}
              className={`text-[10px] sm:text-xs px-2.5 py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
                w.visible 
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-200 dark:border-emerald-900'
                  : 'bg-slate-200/50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-transparent'
              }`}
            >
              {w.visible ? '✓' : ''} {w.titleAr}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamically Render Widgets based on display ORDER and VISIBILITY state */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {widgets
          .filter(w => w.visible)
          .sort((a, b) => a.order - b.order)
          .map(widget => {
            
            // Render specific JSX templates based on Widget ID
            switch (widget.id) {
              case 'interfaces_summary':
                return (
                  <div key={widget.id} className="col-span-1 lg:col-span-12 space-y-4 bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-xs border border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center justify-between border-b border-rose-50/50 dark:border-slate-700/80 pb-3">
                      <div className="flex items-center gap-2">
                        <Layers className="w-5 h-5 text-indigo-500" />
                        <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">{widget.titleAr}</h3>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => moveWidget(widget.id, 'up')}
                          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
                          title="رفع الترتيب للرأس"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveWidget(widget.id, 'down')}
                          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
                          title="إنزال الترتيب للقاع"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-750 text-slate-400 font-bold">
                            <th className="pb-3 text-right">الواجهة المعرّفة (Interface / Device)</th>
                            <th className="pb-3 text-center">أيقونة الحالة</th>
                            <th className="pb-3 text-center">السرعة الحالية (Up/Down)</th>
                            <th className="pb-3 text-center">زمن الاستجابة (Latency)</th>
                            <th className="pb-3 text-center">فقد الحزم (Packet Loss)</th>
                            <th className="pb-3 text-center">الوزن / الأولوية</th>
                            <th className="pb-3 text-center">الوقت النشط</th>
                            <th className="pb-3 text-center">إجراءات ذكية</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-750 font-medium">
                          {interfaces.map(inf => {
                            const isDown = inf.status === 'offline';
                            return (
                              <tr key={inf.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30 transition-all">
                                <td className="py-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className={`p-1.5 rounded-lg ${
                                      inf.status === 'online' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' :
                                      inf.status === 'degraded' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' :
                                      'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                                    }`}>
                                      <Activity className="w-4 h-4 animate-custom-pulse" />
                                    </div>
                                    <div>
                                      <span className="font-bold text-slate-800 dark:text-white block">{inf.name}</span>
                                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{inf.device}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 text-center">
                                  <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                    inf.status === 'online' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' :
                                    inf.status === 'degraded' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-450' :
                                    'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400'
                                  }`}>
                                    {inf.status === 'online' ? 'متصل وموزّن' : inf.status === 'degraded' ? 'كمون مرتفع' : 'منقطع بالكامل'}
                                  </span>
                                </td>
                                <td className="py-4 text-center font-mono">
                                  {isDown ? (
                                    <span className="text-slate-400">—</span>
                                  ) : (
                                    <div className="flex flex-col items-center">
                                      <span className="text-slate-700 dark:text-slate-300 flex items-center gap-0.5 text-xs">
                                        <Download className="w-3 h-3 text-emerald-500 shrink-0" />
                                        <span>{inf.speedDown}</span>
                                        <span className="text-[9px] text-slate-400">Mbps</span>
                                      </span>
                                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                        <Upload className="w-3 h-3 text-blue-400 shrink-0" />
                                        <span>{inf.speedUp}</span>
                                        <span className="text-[9px]">Mbps</span>
                                      </span>
                                    </div>
                                  )}
                                </td>
                                <td className="py-4 text-center font-mono">
                                  {isDown ? (
                                    <span className="text-slate-400">—</span>
                                  ) : (
                                    <span className={inf.latency > 80 ? 'text-amber-500 font-bold' : 'text-slate-600 dark:text-slate-300'}>
                                      {inf.latency}ms
                                    </span>
                                  )}
                                </td>
                                <td className="py-4 text-center">
                                  {isDown ? (
                                    <span className="text-slate-400">—</span>
                                  ) : (
                                    <div className="flex flex-col items-center gap-1">
                                      <span className={`font-mono text-xs ${inf.loss > 2 ? 'text-red-500 font-bold' : 'text-slate-600 dark:text-slate-300'}`}>
                                        {inf.loss}%
                                      </span>
                                      <div className="w-14 bg-slate-100 dark:bg-slate-700 rounded-full h-1 overflow-hidden">
                                        <div 
                                          className={`h-full ${inf.loss > 2 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                                          style={{ width: `${Math.min(100, inf.loss * 10)}%` }} 
                                        />
                                      </div>
                                    </div>
                                  )}
                                </td>
                                <td className="py-4 text-center font-mono">
                                  {selectedWeightId === inf.id ? (
                                    <div className="flex items-center justify-center gap-1">
                                      <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        defaultValue={inf.weight}
                                        id={`weight_inp_${inf.id}`}
                                        className="w-10 px-1 py-0.5 border border-slate-300 rounded bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white"
                                      />
                                      <button 
                                        onClick={() => {
                                          const el = document.getElementById(`weight_inp_${inf.id}`) as HTMLInputElement;
                                          if (el) handleApplyWeightChange(inf.id, Number(el.value));
                                        }}
                                        className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600"
                                      >
                                        <Check className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center">
                                      <span className="text-slate-800 dark:text-white text-xs">
                                        الوزن: <strong>{inf.weight}</strong>
                                      </span>
                                      <button
                                        onClick={() => role !== 'viewer' ? setSelectedWeightId(inf.id) : alert('غير مسموح للمراقبين.')}
                                        className="text-[9px] text-indigo-500 hover:underline mt-0.5 block cursor-pointer"
                                      >
                                        تعديل الوزن
                                      </button>
                                    </div>
                                  )}
                                </td>
                                <td className="py-4 text-center font-mono text-slate-500 dark:text-slate-400">
                                  {isDown ? (
                                    <span className="text-red-500">متوقف</span>
                                  ) : (
                                    <span>
                                      {Math.floor(inf.uptime / 3600)}س {Math.floor((inf.uptime % 3600) / 60)}د
                                    </span>
                                  )}
                                </td>
                                <td className="py-4 text-center">
                                  <button
                                    onClick={() => toggleInterfaceStatus(inf.id)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                      isDown 
                                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                                        : 'bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                                    }`}
                                  >
                                    {isDown ? 'استعادة الاتصال' : 'قطع الخط وإسقاطه'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );

              case 'traffic_distribution':
                return (
                  <div key={widget.id} className="col-span-1 lg:col-span-6 bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-xs border border-slate-100 dark:border-slate-700/50 space-y-4">
                    <div className="flex items-center justify-between border-b border-rose-50/50 dark:border-slate-700/80 pb-3">
                      <div className="flex items-center gap-2">
                        <ArrowUpDown className="w-5 h-5 text-emerald-500" />
                        <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">{widget.titleAr}</h3>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => moveWidget(widget.id, 'up')}
                          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveWidget(widget.id, 'down')}
                          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* SVG traffic distribution visualization */}
                    <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-3">
                      {/* Interactive Custom SVG Doughnut Chart */}
                      <div className="relative w-40 h-40">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#E2E8F0" strokeWidth="12" className="dark:stroke-slate-700" />
                          {/* Dynamically draw colored segments representing traffic ratio */}
                          {(() => {
                            let accumulatedPercent = 0;
                            return trafficDist.map((item, idx) => {
                              const strokeDashArray = `${item.percentage} ${100 - item.percentage}`;
                              const strokeDashOffset = -accumulatedPercent;
                              accumulatedPercent += item.percentage;
                              return (
                                <circle 
                                  key={idx}
                                  cx="50" 
                                  cy="50" 
                                  r="40" 
                                  fill="transparent" 
                                  stroke={item.color} 
                                  strokeWidth="12"
                                  strokeDasharray={strokeDashArray}
                                  strokeDashoffset={strokeDashOffset}
                                  pathLength="100"
                                  className="transition-all duration-1000 ease-in-out"
                                  title={`${item.name}: ${item.percentage}%`}
                                />
                              );
                            });
                          })()}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-[10px] text-slate-400 block font-semibold leading-none">مجموع النِسب</span>
                          <span className="text-xl font-black text-slate-800 dark:text-white mt-1">100%</span>
                        </div>
                      </div>

                      {/* Legends with progress controls info */}
                      <div className="space-y-3 flex-1 min-w-[150px]">
                        {trafficDist.length === 0 ? (
                          <div className="text-center py-4 text-slate-400">كافة واجهات الشبكة منقطعة مسبقاً!</div>
                        ) : (
                          trafficDist.map((item, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5 font-bold">
                                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                  <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                                </div>
                                <span className="font-mono text-slate-800 dark:text-white font-bold">{item.percentage}%</span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${item.percentage}%`, backgroundColor: item.color }} />
                              </div>
                            </div>
                          ))
                        )}
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal border-t border-slate-100 dark:border-slate-750 pt-2 text-justify">
                          💡 يتم حساب نسب التوزيع الحية تلقائياً بناءً على سياسات MWAN3 والأولويات والأوزان النشطة حالياً على المنافذ النشطة.
                        </p>
                      </div>
                    </div>
                  </div>
                );

              case 'speed_monitor':
                return (
                  <div key={widget.id} className="col-span-1 lg:col-span-6 bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-xs border border-slate-100 dark:border-slate-700/50 space-y-4">
                    <div className="flex items-center justify-between border-b border-rose-50/50 dark:border-slate-700/80 pb-3">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
                        <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">{widget.titleAr}</h3>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => moveWidget(widget.id, 'up')}
                          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveWidget(widget.id, 'down')}
                          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Speedometers */}
                    <div className="grid grid-cols-2 gap-4 py-2">
                      {/* Download gauge */}
                      <div className="flex flex-col items-center">
                        <div className="relative w-32 h-20 overflow-hidden">
                          {/* Dial arc */}
                          <svg className="w-full h-full transform" viewBox="0 0 100 50">
                            <path 
                              d="M 10 50 A 40 40 0 0 1 90 50" 
                              fill="none" 
                              stroke="#E2E8F0" 
                              strokeWidth="8" 
                              className="dark:stroke-slate-700" 
                              strokeLinecap="round"
                            />
                            {/* Filled path based on speed value ratio */}
                            {(() => {
                              const totalDownload = interfaces.reduce((sum, inf) => sum + (inf.status !== 'offline' ? inf.speedDown : 0), 0);
                              // Max expected is around 250 Mbps
                              const ratio = Math.min(1, totalDownload / 250);
                              const arcLength = 125; // approximated
                              const strokeDash = arcLength * ratio;
                              return (
                                <path 
                                  d="M 10 50 A 40 40 0 0 1 90 50" 
                                  fill="none" 
                                  stroke="#10B981" 
                                  strokeWidth="8" 
                                  className="transition-all duration-1000 ease-out"
                                  strokeLinecap="round"
                                  strokeDasharray={`${strokeDash} 200`}
                                />
                              );
                            })()}
                          </svg>
                          <div className="absolute bottom-0 inset-x-0 text-center flex flex-col items-center">
                            <span className="text-lg font-black text-slate-800 dark:text-white font-mono leading-none">
                              {interfaces.reduce((sum, inf) => sum + (inf.status !== 'offline' ? inf.speedDown : 0), 0).toFixed(1)}
                            </span>
                            <span className="text-[9px] text-slate-400 mt-1">ميغابت / ثانية تنزيل</span>
                          </div>
                        </div>
                      </div>

                      {/* Upload gage */}
                      <div className="flex flex-col items-center">
                        <div className="relative w-32 h-20 overflow-hidden">
                          {/* Dial arc */}
                          <svg className="w-full h-full transform" viewBox="0 0 100 50">
                            <path 
                              d="M 10 50 A 40 40 0 0 1 90 50" 
                              fill="none" 
                              stroke="#E2E8F0" 
                              strokeWidth="8" 
                              className="dark:stroke-slate-700"
                              strokeLinecap="round"
                            />
                            {/* Filled path based on speed value ratio */}
                            {(() => {
                              const totalUpload = interfaces.reduce((sum, inf) => sum + (inf.status !== 'offline' ? inf.speedUp : 0), 0);
                              const ratio = Math.min(1, totalUpload / 60); // Max expected 60
                              const arcLength = 125;
                              const strokeDash = arcLength * ratio;
                              return (
                                <path 
                                  d="M 10 50 A 40 40 0 0 1 90 50" 
                                  fill="none" 
                                  stroke="#3B82F6" 
                                  strokeWidth="8" 
                                  className="transition-all duration-1000 ease-out"
                                  strokeLinecap="round"
                                  strokeDasharray={`${strokeDash} 200`}
                                />
                              );
                            })()}
                          </svg>
                          <div className="absolute bottom-0 inset-x-0 text-center flex flex-col items-center">
                            <span className="text-lg font-black text-slate-800 dark:text-white font-mono leading-none">
                              {interfaces.reduce((sum, inf) => sum + (inf.status !== 'offline' ? inf.speedUp : 0), 0).toFixed(1)}
                            </span>
                            <span className="text-[9px] text-slate-400 mt-1">ميغابت / ثانية رفع</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );

              case 'mwan3_report':
                return (
                  <div key={widget.id} className="col-span-1 lg:col-span-12 bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-xs border border-slate-100 dark:border-slate-700/50 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-4 border-b border-rose-50/50 dark:border-slate-700/80 pb-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-indigo-500 animate-pulse" />
                        <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">{widget.titleAr}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={reportFilter}
                          onChange={(e) => setReportFilter(e.target.value as any)}
                          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] px-2.5 py-1 text-slate-700 dark:text-slate-300 font-bold focus:outline-hidden"
                        >
                          <option value="all">كافة التقارير والسجلات</option>
                          <option value="info">معلومات فقط (Info)</option>
                          <option value="warning">تنبيهات جودة (Warning)</option>
                          <option value="error">أعطال حادة (Critical)</option>
                        </select>
                        <button
                          onClick={() => exportReport('csv')}
                          className="text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center gap-1 cursor-pointer hover:bg-slate-200"
                        >
                          <Download className="w-3.5 h-3.5" />
                          تصدير CSV
                        </button>
                      </div>
                    </div>

                    {/* Snd table reports */}
                    <div className="space-y-2 max-h-[220px] overflow-y-auto">
                      {alerts
                        .filter(a => reportFilter === 'all' || a.level === reportFilter)
                        .map((alertItem, idx) => (
                          <div 
                            key={idx} 
                            className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-3 transition-all ${
                              alertItem.level === 'error' 
                                ? 'bg-red-50/70 border-red-100 dark:bg-red-950/15 dark:border-red-900/30 text-red-800 dark:text-red-400' 
                                : alertItem.level === 'warning'
                                ? 'bg-amber-50/70 border-amber-100 dark:bg-amber-950/15 dark:border-amber-900/30 text-amber-800 dark:text-amber-400'
                                : 'bg-slate-50 border-slate-100 dark:bg-slate-900/40 dark:border-slate-800 text-slate-750 dark:text-slate-300'
                            }`}
                          >
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase mt-0.5 ${
                              alertItem.level === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-450' :
                              alertItem.level === 'warning' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-450' :
                              'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {alertItem.level === 'error' ? 'عطل' : alertItem.level === 'warning' ? 'تراجع' : 'معلومة'}
                            </span>
                            <div className="flex-1">
                              <p className="font-semibold text-slate-850 dark:text-slate-200">{alertItem.message}</p>
                              <span className="block text-[10px] text-slate-400 font-mono mt-1">
                                {new Date(alertItem.timestamp).toLocaleString('ar-EG')}
                              </span>
                            </div>
                          </div>
                      ))}
                    </div>
                  </div>
                );

              case 'system_footprint':
                return (
                  <div key={widget.id} className="col-span-1 lg:col-span-6 bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-xs border border-slate-100 dark:border-slate-700/50 space-y-4">
                    <div className="flex items-center justify-between border-b border-rose-50/50 dark:border-slate-700/80 pb-3">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-amber-500" />
                        <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">{widget.titleAr}</h3>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => moveWidget(widget.id, 'up')}
                          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveWidget(widget.id, 'down')}
                          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* system resources status */}
                    <div className="space-y-4 py-2">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-slate-700 dark:text-slate-300">ضغط المعالج (MIPS @ 580MHz)</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-white">{metrics.cpuUsage}%</span>
                        </div>
                        <div className="w-full bg-slate-150 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${
                              metrics.cpuUsage > 80 ? 'bg-red-500' : metrics.cpuUsage > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`} 
                            style={{ width: `${metrics.cpuUsage}%` }} 
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-slate-700 dark:text-slate-300">الذاكرة العشوائية المستغلة (Total RAM 128MB)</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-white">{metrics.ramUsage}%</span>
                        </div>
                        <div className="w-full bg-slate-150 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                            style={{ width: `${metrics.ramUsage}%` }} 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3.5 pt-1">
                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
                          <span className="text-[10px] text-slate-450 dark:text-slate-400 font-bold block">مجموع تبريد الراوتر</span>
                          <span className="text-sm font-black text-slate-800 dark:text-white mt-0.5 block">{metrics.temp}°C</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
                          <span className="text-[10px] text-slate-450 dark:text-slate-400 font-bold block">وقت تشغيل موازنة الحمل</span>
                          <span className="text-sm font-black text-slate-800 dark:text-white mt-0.5 block">
                            {Math.floor(metrics.mwan3Uptime / 3600)}س {Math.floor((metrics.mwan3Uptime % 3600) / 60)}د
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );

              case 'quick_actions':
                return (
                  <div key={widget.id} className="col-span-1 lg:col-span-12 bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-xs border border-slate-100 dark:border-slate-700/50 space-y-4">
                    <div className="flex items-center justify-between border-b border-rose-50/50 dark:border-slate-700/80 pb-3">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-5 h-5 text-amber-500 animate-pulse" />
                        <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">{widget.titleAr}</h3>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => moveWidget(widget.id, 'up')}
                          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveWidget(widget.id, 'down')}
                          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                        <span className="text-xs font-bold text-slate-800 dark:text-white block">خط الألياف الضوئية (WAN1)</span>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          محاكاة قطع خط WAN1 (الفايبر) لمشاهدة كيف ستقوم موازنة MWAN3 بتحويل مسار حركة الإنترنت بسرعة البرق للخطوط البديلة.
                        </p>
                        <button
                          onClick={() => toggleInterfaceStatus('wan1')}
                          className={`w-full py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            interfaces.find(i => i.id === 'wan1')?.status === 'offline'
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450 border border-transparent'
                          }`}
                        >
                          {interfaces.find(i => i.id === 'wan1')?.status === 'offline' ? 'إعادة الإتصال بالبوابة' : 'محاكاة عطل خط WAN1'}
                        </button>
                      </div>

                      <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                        <span className="text-xs font-bold text-slate-800 dark:text-white block">خط النطاق العريض DSL (WAN2)</span>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          قطع قناة الـ DSL لمشاهدة تحول السياسات وتركز تدفق الموارد كاملة عبر واجهة WAN1 أو الخط الإحتياطي.
                        </p>
                        <button
                          onClick={() => toggleInterfaceStatus('wan2')}
                          className={`w-full py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            interfaces.find(i => i.id === 'wan2')?.status === 'offline'
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450'
                          }`}
                        >
                          {interfaces.find(i => i.id === 'wan2')?.status === 'offline' ? 'إعادة الإتصال بالبوابة' : 'محاكاة عطل خط WAN2'}
                        </button>
                      </div>

                      <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3 flex flex-col justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-800 dark:text-white block flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            استعادة التوازن الكلي للراوتر
                          </span>
                          <p className="text-[11px] text-slate-400 leading-relaxed mt-1.5">
                            إلغاء كافة المحاكاة وإعادة كافة القنوات (Fiber, DSL, LTE) لوضعها التشغيلي وربطها التلقائي بمزودات الخدمة.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            if (role === 'viewer') {
                              alert('طلب مرفوض لمراقب النظام.');
                              return;
                            }
                            setInterfaces(prev => prev.map(i => ({ 
                              ...i, 
                              status: i.type === 'lte' ? 'degraded' : 'online',
                              uptime: i.uptime === 0 ? 120 : i.uptime
                            })));
                            setAlerts(old => [
                              {
                                id: `alert_${Date.now()}`,
                                timestamp: new Date().toISOString(),
                                level: 'info',
                                message: 'تمت استعادة وبدء تشغيل كافة واجهات الشبكة بنجاح، موازنة MWAN3 تعمل الآن بـ 100% كفاءة.',
                                resolved: true
                              },
                              ...old
                            ]);
                            onTriggerNotification('تمت استعادة شبكة الاتصالات وإعادة دمج كافة الواجهات.', 'info');
                          }}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-505 text-white shadow-md font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                        >
                          <RefreshCcw className="w-3.5 h-3.5" />
                          إرجاع كافة القنوات للعمل
                        </button>
                      </div>
                    </div>
                  </div>
                );

              default:
                return null;
            }
          })}
      </div>
    </div>
  );
}
