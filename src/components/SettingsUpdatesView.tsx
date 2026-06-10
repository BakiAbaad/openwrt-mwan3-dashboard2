/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldAlert, RefreshCw, CheckCircle, AlertTriangle, Cpu, Globe, 
  Plus, Trash2, Edit2, Check, X, Wifi, ShieldCheck, Play 
} from 'lucide-react';
import { NetworkInterface, UpdateFeed, UserRole } from '../types';
import { INITIAL_UPDATES } from '../data';

interface SettingsUpdatesViewProps {
  interfaces: NetworkInterface[];
  setInterfaces: React.Dispatch<React.SetStateAction<NetworkInterface[]>>;
  updates: UpdateFeed[];
  setUpdates: React.Dispatch<React.SetStateAction<UpdateFeed[]>>;
  role: UserRole;
  onTriggerNotification: (message: string, level: 'info' | 'warning' | 'error') => void;
}

export default function SettingsUpdatesView({
  interfaces,
  setInterfaces,
  updates,
  setUpdates,
  role,
  onTriggerNotification
}: SettingsUpdatesViewProps) {
  // New network interface form state
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'fiber' | 'dsl' | 'lte' | 'starlink'>('starlink');
  const [device, setDevice] = useState('eth1');
  const [weight, setWeight] = useState(1);
  const [priority, setPriority] = useState(1);
  const [speedDown, setSpeedDown] = useState(100);
  const [speedUp, setSpeedUp] = useState(30);
  const [trackingIps, setTrackingIps] = useState('1.1.1.1, 8.8.8.8');

  // Auto-updating simulator state
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateLog, setUpdateLog] = useState<string[]>([]);

  // Add custom interface
  const handleAddInterface = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'viewer') {
      alert('طلب مرفوض: تحتاج لصلاحية مدير النظام لإضافة خطوط شبكة جديدة.');
      return;
    }
    if (!name.trim()) return;

    const newInf: NetworkInterface = {
      id: `wan_${Date.now()}`,
      name: name.replace(/\s+/g, '_'),
      type,
      status: 'online',
      speedUp: Number(speedUp),
      speedDown: Number(speedDown),
      latency: 24,
      loss: 0,
      weight: Number(weight),
      priority: Number(priority),
      enabled: true,
      trackingIps: trackingIps.split(',').map(ip => ip.trim()).filter(Boolean),
      uptime: 60,
      device
    };

    setInterfaces([...interfaces, newInf]);
    setIsAdding(false);
    // Reset form
    setName('');
    setType('starlink');
    setDevice('eth1');
    setWeight(1);
    setPriority(1);
    setSpeedDown(100);
    setSpeedUp(30);
    setTrackingIps('1.1.1.1, 8.8.8.8');

    onTriggerNotification(`تمت إضافة وتكوين واجهة الاتصال الجديدة [${newInf.name}] بنجاح وجاري إلحاقها بنظام موازنة الأحمال.`, 'info');
  };

  // Delete interface
  const handleDeleteInterface = (id: string, interfaceName: string) => {
    if (role === 'viewer') {
      alert('طلب مرفوض لمراقبين الأنظمة.');
      return;
    }
    if (confirm(`هل أنت متأكد من حذف واجهة الاتصال [${interfaceName}] وإخراجها نهائياً من موازنة الأحمال؟`)) {
      setInterfaces(interfaces.filter(inf => inf.id !== id));
      onTriggerNotification(`تم حذف الواجهة [${interfaceName}] وإزالتها من ملفات إعدادات UCI للراوتر.`, 'warning');
    }
  };

  // Toggle interface enable/disable
  const handleToggleEnable = (id: string, name: string, currentState: boolean) => {
    if (role === 'viewer') {
      alert('طلب مرفوض لمراقبين الأنظمة.');
      return;
    }
    setInterfaces(prev => prev.map(inf => {
      if (inf.id === id) {
        return { ...inf, enabled: !currentState, status: !currentState ? 'online' : 'offline' };
      }
      return inf;
    }));
    onTriggerNotification(`تم ${!currentState ? 'تمكين' : 'تعطيل'} واجهة الحزم [${name}].`, 'info');
  };

  // Run security auto-updates simulator
  const runAutoUpdateCheck = () => {
    if (role === 'viewer') {
      alert('يرجى تسجيل الدخول كمسؤول شبكة للتحقق وتنزيل التحديثات الأمنية وتطبيقها.');
      return;
    }

    setIsUpdating(true);
    setUpdateLog(['بدء فحص حزم الراوتر والبحث عن ثغرات أمنية...']);

    setTimeout(() => {
      setUpdateLog(prev => [...prev, '✓ تم التحقق من قاعدة بيانات CVE المستضافة لدى OpenWrt Security Tracker.']);
    }, 1000);

    setTimeout(() => {
      const pendingUpdates = updates.filter(u => !u.applied);
      if (pendingUpdates.length === 0) {
        setUpdateLog(prev => [...prev, '✓ كافة حزم النظام مسجلة بآخر التحديثات، النظام محصن بـ 100% ضد الثغرات المكتشفة مؤخراً.']);
        setIsUpdating(false);
        onTriggerNotification('كافة حزم MWAN3 محدثة لآخر إصدار أمني.', 'info');
      } else {
        setUpdateLog(prev => [...prev, `[!] جاري تحميل وتنزيل الحزمة الأمنية الحيوية إصدار [${pendingUpdates[0].version}] وإجراء ترقية تلقائية...`]);
      }
    }, 2200);

    setTimeout(() => {
      const pendingUpdates = updates.filter(u => !u.applied);
      if (pendingUpdates.length > 0) {
        setUpdates(prev => prev.map(u => ({ ...u, applied: true })));
        setUpdateLog(prev => [
          ...prev, 
          `✓ تم فك الضغط بنجاح وتطبيق رقعة الحماية الأمنية إصدار [${pendingUpdates[0].version}].`,
          '✓ إعادة تشغيل خدمة uHTTPd و LuCI Engine بشكل آمن وبدون انقطاع للإرسال.',
          '🎉 تمت ترقية النظام بالكامل وتأمين الراوتر من الثغرات المكتشفة بنجاح.'
        ]);
        setIsUpdating(false);
        onTriggerNotification('تم إتمام الترقية التلقائية وتثبيت حزمة الحماية الأمنية بنجاح.', 'info');
      }
    }, 4500);
  };

  const pendingUpdatesCount = updates.filter(u => !u.applied).length;

  return (
    <div className="space-y-6" id="settings_updates_view">
      {/* Upper Grid: Alert feed and Updates list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Security Autoupdates and vulnerability notification block */}
        <div className="col-span-1 lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-xs border border-slate-100 dark:border-slate-700/50 space-y-4">
            <div className="flex items-center justify-between border-b border-rose-50/50 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-500 animate-custom-pulse" />
                <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">إشعارات الحماية والتحديثات التلقائية المستمرة</h3>
              </div>
              {pendingUpdatesCount > 0 && (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-red-150 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-extrabold animate-pulse">
                  {pendingUpdatesCount} تحديثات معلّقة
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              تراقب لوحة التحكم بشكل استباقي أي تغذية إخبارية بخصوص مستجدات الحماية في OpenWrt. يرجى المداومة على الترقية لضمان تأمين منافذ الراوتر الخارجية من محاولات التسلل أو الاستغلال السيء.
            </p>

            {/* Updates Log / vulnerability items */}
            <div className="space-y-3.5 max-h-[300px] overflow-y-auto">
              {updates.map(update => (
                <div 
                  key={update.id} 
                  className={`p-3.5 rounded-xl border text-xs flex gap-3.5 transition-all ${
                    update.applied 
                      ? 'bg-emerald-50/40 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/30' 
                      : update.severity === 'critical'
                      ? 'bg-red-50/80 border-red-100 dark:bg-red-950/20 dark:border-red-900/40 animate-pulse'
                      : 'bg-amber-50/50 border-amber-100 dark:bg-amber-950/10 dark:border-amber-900/30'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {update.applied ? (
                      <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-450 flex items-center justify-center font-bold text-[9px]">✔</span>
                    ) : (
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${
                        update.severity === 'critical' ? 'bg-red-150 text-red-600' : 'bg-amber-100 text-amber-600'
                      }`}>!</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                      <span className="font-bold text-slate-800 dark:text-white">{update.title}</span>
                      <div className="flex items-center gap-1.5 font-mono text-[9px] font-bold">
                        <span className="text-slate-400">{update.date}</span>
                        <span className={`px-1 rounded ${
                          update.applied ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {update.applied ? 'مطبّق وآمن' : 'معلّق'}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{update.description}</p>
                    <div className="flex items-center gap-2 pt-1 font-semibold">
                      <span className="text-[9px] text-slate-400">الإصدار المتاح: <code className="font-mono text-indigo-500">{update.version}</code></span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                        update.severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        مستوى الخطر: {update.severity === 'critical' ? 'حرج جداً' : update.severity === 'high' ? 'مرتفع' : 'متوسط'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Run updating console logs */}
            {updateLog.length > 0 && (
              <div className="bg-slate-900 border border-slate-950 p-4 rounded-xl space-y-1 shadow-inner">
                <span className="text-[10px] text-indigo-400 font-bold block mb-1">شاشة التثبيت والترقية التلقائية (Live Term Log):</span>
                {updateLog.map((log, idx) => (
                  <p key={idx} className="font-mono text-[11px] text-emerald-400 leading-relaxed">{log}</p>
                ))}
              </div>
            )}

            {/* Trigger Updates Auto check button */}
            <div className="flex justify-end">
              <button
                onClick={runAutoUpdateCheck}
                disabled={isUpdating}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-505 disabled:bg-slate-300 dark:disabled:bg-slate-750 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md disabled:pointer-events-none"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    جاري الترقية وسد الثغرات...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    تفعيل تحديث الحماية الذكية الآن
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Custom Connections and Interfaces Add manager */}
        <div className="col-span-1 lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-xs border border-slate-100 dark:border-slate-700/50 space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center justify-between border-b border-rose-50/50 dark:border-slate-700 pb-3">
              <span className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-500" />
                تخصيص وتبديل واجهات الشبكة
              </span>
              <button
                onClick={() => {
                  if (role === 'viewer') {
                    alert('يتطلب صلاحية الإدارة لإجراء تعديلات هيكلية.');
                    return;
                  }
                  setIsAdding(!isAdding);
                }}
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline cursor-pointer"
              >
                {isAdding ? 'إغلاق الاستمارة' : '+ إضافة واجهة'}
              </button>
            </h3>

            {/* Simulated Add Line Form */}
            {isAdding && (
              <form onSubmit={handleAddInterface} className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-350 mb-1">اسم الواجهة الجديد (WAN ID)</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="مثال: Starlink_Backup"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-150 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-350 mb-1">نوع التوصيل</label>
                    <select
                      value={type}
                      onChange={(e: any) => setType(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-150 focus:outline-hidden"
                    >
                      <option value="fiber">ألياف ضوئية (Fiber)</option>
                      <option value="dsl">خط أرضي (DSL)</option>
                      <option value="lte">شبكة خلوية (LTE 4G/5G)</option>
                      <option value="starlink">ستارلينك فضائي (Starlink)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-350 mb-1">المنفذ الفيزيائي (Device)</label>
                    <input
                      type="text"
                      required
                      value={device}
                      onChange={(e) => setDevice(e.target.value)}
                      placeholder="eth1, wlan0, usb0"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-150"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-350 mb-1">الأولوية (Priority Metric)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="10"
                      value={priority}
                      onChange={(e) => setPriority(Number(e.target.value))}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-150"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-350 mb-1">الوزن النسبي للحصص</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-150"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-350 mb-1">سرعة التنزيل المتوقعة (Mbps)</label>
                    <input
                      type="number"
                      value={speedDown}
                      onChange={(e) => setSpeedDown(Number(e.target.value))}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-150"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-350 mb-1">عناوين التتبع التلقائي (Tracking IPs)</label>
                  <input
                    type="text"
                    value={trackingIps}
                    onChange={(e) => setTrackingIps(e.target.value)}
                    placeholder="1.1.1.1, 8.8.8.8"
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-150"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs rounded-lg font-bold"
                  >
                    إلغاء التشكيل
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-550 text-white text-xs rounded-lg font-bold"
                  >
                    حفظ وإشراك الواجهة
                  </button>
                </div>
              </form>
            )}

            {/* List of current tracked interfaces config with quick toggle switches */}
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {interfaces.map(inf => (
                <div key={inf.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="text-slate-400 dark:text-slate-600">
                      <Wifi className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="text-xs text-slate-800 dark:text-white">{inf.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({inf.device})</span>
                      </div>
                      <div className="flex gap-2 text-[10px] text-slate-400 mt-1">
                        <span>الوزن: <strong>{inf.weight}</strong></span>
                        <span>مقياس الأولوية: <strong>{inf.priority}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {/* Toggle button */}
                    <button
                      onClick={() => handleToggleEnable(inf.id, inf.name, inf.enabled)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all cursor-pointer ${
                        inf.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-all ${
                        inf.enabled ? '-translate-x-1' : '-translate-x-4.5'
                      }`} />
                    </button>

                    {/* Delete button (Avoid deleting safety, but allow developer customization) */}
                    <button
                      onClick={() => handleDeleteInterface(inf.id, inf.name)}
                      disabled={interfaces.length <= 1}
                      className="p-1 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-30 cursor-pointer"
                      title="حذف واجهة الإتصال بالكامل"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
