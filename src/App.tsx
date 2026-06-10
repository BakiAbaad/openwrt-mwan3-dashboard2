/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity, Shield, ShieldAlert, Cpu, Settings, Sliders, 
  Code, BookOpen, Moon, Sun, Bell, Terminal, RefreshCw, 
  Laptop, AlertCircle, X, HelpCircle, CheckCircle, Database
} from 'lucide-react';
import { NetworkInterface, AlertLog, DashboardWidget, SystemMetrics, UserRole, UpdateFeed } from './types';
import { 
  INITIAL_INTERFACES, INITIAL_ALERTS, DEFAULT_WIDGETS, 
  INITIAL_SYSTEM_METRICS, INITIAL_UPDATES 
} from './data';

// Import subcomponents
import DashboardView from './components/DashboardView';
import APIView from './components/APIView';
import ConfigEditor from './components/ConfigEditor';
import DocView from './components/DocView';
import SettingsUpdatesView from './components/SettingsUpdatesView';

export default function App() {
  // Global States
  const [role, setRole] = useState<UserRole>('admin');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState<'monitor' | 'settings' | 'uci' | 'api' | 'docs'>('monitor');
  
  // Real-time metrics
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>(INITIAL_INTERFACES);
  const [alerts, setAlerts] = useState<AlertLog[]>(INITIAL_ALERTS);
  const [widgets, setWidgets] = useState<DashboardWidget[]>(DEFAULT_WIDGETS);
  const [metrics, setMetrics] = useState<SystemMetrics>(INITIAL_SYSTEM_METRICS);
  const [updates, setUpdates] = useState<UpdateFeed[]>(INITIAL_UPDATES);

  // Notifications System state
  const [notifications, setNotifications] = useState<{ id: string; message: string; level: 'info' | 'warning' | 'error' }[]>([]);

  const triggerNotification = (message: string, level: 'info' | 'warning' | 'error') => {
    const id = `notif_${Date.now()}`;
    setNotifications(prev => [...prev, { id, message, level }]);
    
    // Automatically dismiss toast after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5500);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Auto-trigger alerts when a line goes down (already encapsulated in DashboardView outage but can also run periodically or on specific logs)
  const unreadCriticalAlertsCount = alerts.filter(a => a.level === 'error' && !a.resolved).length;

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div 
        dir="rtl" 
        className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-all duration-300 flex flex-col pt-1"
        id="mwan3_panel_wrap"
      >
        {/* Toast Notification Container Overlay */}
        <div className="fixed top-4 left-4 z-50 space-y-3.5 max-w-sm w-full font-bold">
          {notifications.map(notif => (
            <div
              key={notif.id}
              className={`p-4 rounded-xl border shadow-xl flex gap-3 text-xs justify-between items-start animate-custom-pulse transform hover:scale-102 transition-all ${
                notif.level === 'error' 
                  ? 'bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200' 
                  : notif.level === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200'
                  : 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200'
              }`}
            >
              <div className="flex gap-2.5 items-start">
                <span className="shrink-0 mt-0.5">
                  {notif.level === 'error' ? '❌' : notif.level === 'warning' ? '⚠️' : '🔔'}
                </span>
                <p className="leading-relaxed">{notif.message}</p>
              </div>
              <button 
                onClick={() => removeNotification(notif.id)}
                className="hover:opacity-70 text-slate-400 dark:text-slate-500 cursor-pointer p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Global Header Bar */}
        <header className="sticky top-0 z-45 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/80 px-4 py-3 shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
            
            {/* Title / Branding */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/10">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1 className="text-base sm:text-lg font-black text-slate-800 dark:text-white">بوابة موازنة الأحمال الفورية OpenWrt MWAN3</h1>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                    v24.0.1M
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-400 font-mono mt-0.5">
                  معالج MT7621 • نواة MIPS32 • واجهة LuCI الذكية الخفيفة
                </p>
              </div>
            </div>

            {/* Quick Actions (Theme, Roles switcher, Alerts Indicator) */}
            <div className="flex items-center gap-3">
              
              {/* Role switch Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <Shield className="w-4 h-4 text-slate-400" />
                <select
                  value={role}
                  onChange={(e) => {
                    const newRole = e.target.value as UserRole;
                    setRole(newRole);
                    triggerNotification(`تم تغيير صلاحية المطور بنجاح لتصبح: [${newRole === 'admin' ? 'مدير كامل' : newRole === 'operator' ? 'مشغل فني' : 'مراجع مراقب'}].`, 'info');
                  }}
                  className="bg-transparent border-none text-xs text-slate-700 dark:text-slate-350 focus:outline-hidden font-bold"
                  title="تغيير صلاحيات الحساب لمحاكاة مستويات الأمان"
                >
                  <option value="admin">مدير النظام (Admin)</option>
                  <option value="operator">فني تشغيل (Operator)</option>
                  <option value="viewer">مراقب قراءة (Viewer)</option>
                </select>
              </div>

              {/* Alerts Bell notification badge */}
              <div 
                className={`p-2 rounded-xl border transition-all relative ${
                  unreadCriticalAlertsCount > 0 
                    ? 'bg-rose-50 border-rose-200 text-rose-500 dark:bg-rose-950/30 dark:border-rose-900 animate-bounce' 
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}
                title={`${unreadCriticalAlertsCount} أعطال نشطة تتطلب المعاينة`}
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCriticalAlertsCount > 0 && (
                  <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-red-600 text-white font-mono text-[9px] font-black flex items-center justify-center">
                    {unreadCriticalAlertsCount}
                  </span>
                )}
              </div>

              {/* Night Dark mode Toggle button */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-amber-400 transition-all cursor-pointer"
                title={isDarkMode ? 'التبديل إلى الوضع النهاري المشرق' : 'التبديل إلى الوضع الليلي المظلم'}
              >
                {isDarkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </button>
            </div>

          </div>
        </header>

        {/* Tab Selection Navigation Bar */}
        <nav className="bg-slate-100/50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800/60 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-2.5 overflow-x-auto py-1">
            <button
              onClick={() => setActiveTab('monitor')}
              className={`text-xs px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'monitor' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/10' 
                  : 'text-slate-500 dark:text-slate-450 hover:bg-slate-200/50 dark:hover:bg-slate-800'
              }`}
            >
              <Cpu className="w-4 h-3.5" />
              لوحة المراقبة
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`text-xs px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'settings' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10' 
                  : 'text-slate-500 dark:text-slate-450 hover:bg-slate-200/50 dark:hover:bg-slate-800'
              }`}
            >
              <Settings className="w-4 h-3.5" />
              تكوين الشبكات والأمان
            </button>

            <button
              onClick={() => setActiveTab('uci')}
              className={`text-xs px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'uci' 
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-500/10' 
                  : 'text-slate-500 dark:text-slate-450 hover:bg-slate-200/50 dark:hover:bg-slate-800'
              }`}
            >
              <Sliders className="w-4 h-3.5" />
              ملف إعدادات UCI
            </button>

            <button
              onClick={() => setActiveTab('api')}
              className={`text-xs px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'api' 
                  ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-md' 
                  : 'text-slate-500 dark:text-slate-450 hover:bg-slate-200/50 dark:hover:bg-slate-800'
              }`}
            >
              <Terminal className="w-4 h-3.5" />
              المطور وبيئة اختبار الـ API
            </button>

            <button
              onClick={() => setActiveTab('docs')}
              className={`text-xs px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'docs' 
                  ? 'bg-sky-600 text-white shadow-md' 
                  : 'text-slate-500 dark:text-slate-450 hover:bg-slate-200/50 dark:hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-3.5" />
              الوثائق والدليل الفني
            </button>
          </div>
        </nav>

        {/* Main Content Area Wrapper */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
          {activeTab === 'monitor' && (
            <DashboardView
              interfaces={interfaces}
              setInterfaces={setInterfaces}
              alerts={alerts}
              setAlerts={setAlerts}
              widgets={widgets}
              setWidgets={setWidgets}
              metrics={metrics}
              setMetrics={setMetrics}
              role={role}
              onTriggerNotification={triggerNotification}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsUpdatesView
              interfaces={interfaces}
              setInterfaces={setInterfaces}
              updates={updates}
              setUpdates={setUpdates}
              role={role}
              onTriggerNotification={triggerNotification}
            />
          )}

          {activeTab === 'uci' && (
            <ConfigEditor
              role={role}
              onTriggerNotification={triggerNotification}
            />
          )}

          {activeTab === 'api' && (
            <APIView
              role={role}
            />
          )}

          {activeTab === 'docs' && (
            <DocView />
          )}
        </main>

        {/* Status Indicator Sticky Footer */}
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-150 dark:border-slate-800/80 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4 text-xs font-mono text-slate-400 dark:text-slate-400">
            <div className="flex items-center gap-3.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Laptop className="w-3.5 h-3.5" />
                عضوية الراوتر: <strong className="text-slate-700 dark:text-slate-300">OpenWrt_Router_C1</strong>
              </span>
              <span>•</span>
              <span>الحرارة: <strong className="text-slate-700 dark:text-slate-300">{metrics.temp}°C</strong></span>
              <span>•</span>
              <span>الرام الشاغر: <strong className="text-slate-700 dark:text-slate-300">{(128 - (128 * metrics.ramUsage / 100)).toFixed(1)}MB / 128MB</strong></span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>اتصال آمن مفعّل SSL</span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
