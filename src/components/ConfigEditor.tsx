/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sliders, Code, Save, RefreshCw, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { UserRole } from '../types';
import { INITIAL_CONFIG_CONTENT } from '../data';

interface ConfigEditorProps {
  role: UserRole;
  onConfigChange?: (newContent: string) => void;
  onTriggerNotification: (message: string, level: 'info' | 'warning' | 'error') => void;
}

export default function ConfigEditor({ role, onConfigChange, onTriggerNotification }: ConfigEditorProps) {
  const [configText, setConfigText] = useState(INITIAL_CONFIG_CONTENT);
  const [isApplying, setIsApplying] = useState(false);
  const [validationMsg, setValidationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleReset = () => {
    if (confirm('هل أنت متأكد من إعادة تعيين ملف التهيئة للملف الافتراضي للراوتر؟')) {
      setConfigText(INITIAL_CONFIG_CONTENT);
      setValidationMsg(null);
    }
  };

  const handleApplyConfig = () => {
    if (role === 'viewer' || role === 'operator') {
      alert('عذراً، لا تملك الصلاحية لتغيير ملف التهيئة للراوتر. هذه الميزة حصرية لمدير النظام (Administrator).');
      return;
    }

    setIsApplying(true);
    setValidationMsg(null);

    // Simulated parser validation check
    setTimeout(() => {
      let isSuccess = true;
      let errorDesc = '';

      if (!configText.includes("config globals 'globals'")) {
        isSuccess = false;
        errorDesc = 'خطأ بالتكوين: يرجى التحقق من وجود المعرّف العام [config globals globals] في رأس الملف.';
      } else if (!configText.includes("config interface")) {
        isSuccess = false;
        errorDesc = 'خطأ بالتكوين: يجب تخصيص واجهة تشغيل واحدة على الأقل بالملف (config interface).';
      } else if (configText.length < 200) {
        isSuccess = false;
        errorDesc = 'خطأ بالتكوين: ملف /etc/config/mwan3 قصير جداً ويبدو تالفاً.';
      }

      setIsApplying(false);

      if (isSuccess) {
        setValidationMsg({
          type: 'success',
          text: 'تم حفظ وتدقيق ملف التهيئة بنجاح! تم تحديث جدول موازنة الأحمال وإعادة تشغيل خدمة mwan3 بنجاح.'
        });
        onTriggerNotification('تم تحديث ملف الإعداد mwan3 وإعادة تحميل الفهرس بأمان.', 'info');
        if (onConfigChange) {
          onConfigChange(configText);
        }
      } else {
        setValidationMsg({
          type: 'error',
          text: errorDesc
        });
        onTriggerNotification('فشل في فحص وتطبيق ملف mwan3 لوجود أخطاء في الصياغة (Syntax Error).', 'error');
      }
    }, 1500);
  };

  return (
    <div className="space-y-6" id="config_file_section">
      {/* Header and status alerts */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xs border border-slate-100 dark:border-slate-700/50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Sliders className="w-8 h-8 text-amber-500" />
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">معدل ملف تهيئة النظام الرئيسي (/etc/config/mwan3)</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                تعديل وتدقيق ملف UCI للتحكم الكامل بقوانين موازنة الأحمال والوزن النسبي والـ Metric مباشرة من متصفح الويب.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 font-bold border border-amber-100/50 dark:border-amber-900/30">
              UCI Engine V2
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor Box */}
        <div className="col-span-1 lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xs border border-slate-100 dark:border-slate-700/50 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">/etc/config/mwan3</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[11px] font-semibold text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-all cursor-pointer"
                >
                  استعادة الافتراضي
                </button>
              </div>
            </div>

            {role !== 'admin' && (
              <div className="bg-pink-50 dark:bg-pink-950/20 text-pink-700 dark:text-pink-400 p-3.5 rounded-xl text-xs flex gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  أنت مسجل حالياً بصلاحيات <strong>{role === 'operator' ? 'مشغل (Operator)' : 'مراقب (Viewer)'}</strong>. صلاحية تعديل وتحديث ملف mwan3 UCI الرئيسي مخصصة فقط <strong>لمسؤولي الأنظمة (Super Admin)</strong> لضمان استقرار الشبكة.
                </span>
              </div>
            )}

            <div className="relative">
              <textarea
                dir="ltr"
                value={configText}
                onChange={(e) => setConfigText(e.target.value)}
                disabled={role !== 'admin' || isApplying}
                className="w-full h-[450px] bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-[11px] sm:text-xs leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 shadow-inner border border-slate-950 resize-y disabled:opacity-80"
                placeholder="تحميل الكود الافتراضي..."
              />
              <div className="absolute bottom-3 left-3 px-2 py-1 rounded bg-slate-800/80 text-slate-400 text-[9px] font-mono select-none">
                {configText.split('\n').length} lines
              </div>
            </div>

            {/* Validation Feedback & Logs */}
            {validationMsg && (
              <div className={`p-4 rounded-xl border flex gap-3 text-xs ${
                validationMsg.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400'
                  : 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 text-red-800 dark:text-red-400'
              }`}>
                {validationMsg.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
                )}
                <div>
                  <h4 className="font-bold">{validationMsg.type === 'success' ? 'عملية تطبيق ناجحة' : 'خطأ في التحقق من بنية UCI'}</h4>
                  <p className="mt-1 leading-relaxed">{validationMsg.text}</p>
                </div>
              </div>
            )}

            {/* Actions Buttons */}
            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={handleApplyConfig}
                disabled={role !== 'admin' || isApplying}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isApplying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    جارِ التحقق وتدقيق البنية...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    حفظ وتطبيق الخطة الجديدة
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Documentation / Info Block Side panel */}
        <div className="col-span-1 lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-xs border border-slate-100 dark:border-slate-700/50 space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              تنبيهات التهيئة الذكية
            </h3>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block mb-1">تحديد الوزن النسبي:</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  يؤثر الخيار <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px] text-rose-500 font-mono">option weight</code> على جدولة الحزم. الوزن 3 مع الوزن 1 يعني توجيه 75% من حركة المرور للواجهة الأولى و 25% للثانية.
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold text-indigo-500 block mb-1">أجهزة التتبع الآلي (Tracking IPs):</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  يفضل دوماً كتابة خوادم نظام أسماء النطاقات (DNS) سريعة ومستقرة مثل <code className="font-mono">1.1.1.1</code> و <code className="font-mono">8.8.8.8</code> لتلافي انقطاع الخدمة بسبب كثرة الـ Ping.
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold text-emerald-500 block mb-1">خيار الملاذ الأخير (Last Resort):</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  الخيار <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px] font-mono">option last_resort</code> يحدد ما يتم فعله عند انقطاع كافة الخطوط (مثلاً unreachable للرفض المباشر لتوفير طاقة المعالجة).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
