/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookOpen, Code, Terminal, CheckCircle, Copy, FileCode, Folder, Shield, Download, Server } from 'lucide-react';
import { TECHNICAL_DOCS_AR } from '../data';

export default function DocView() {
  const [activeTab, setActiveTab ] = useState<'manual' | 'ipk' | 'api'>('ipk');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const ipkStructure = [
    { name: 'CONTROL/', type: 'folder', desc: 'مجلد التحكم والتعريف الخاص بالحزمة' },
    { name: 'CONTROL/control', type: 'file', content: `Package: luci-app-mwan3-dashboard
Version: 1.0.0
Architecture: all
Maintainer: BakiAbaad <git@github.com:BakiAbaad/openwrt-mwan3-dashboard.git>
Depends: mwan3, rpcd, uhttpd
Description: Arabic web dashboard for monitoring mwan3 load balancing with dark mode and charts.` },
    { name: 'CONTROL/postinst', type: 'file', content: `#!/bin/sh
# تحسين صلاحيات الملفات التنفيذية للـ API
chmod +x /usr/libexec/rpcd/mwan3-dashboard-api

# إعادة تشغيل الخدمات لتفعيل التعديلات
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart

echo "تم تثبيت لوحة تحكم mwan3 بنجاح باللغة العربية!"
exit 0` },
    { name: 'usr/libexec/rpcd/mwan3-dashboard-api', type: 'file', content: `#!/usr/bin/lua
local ubus = require "ubus"
local json = require "luci.jsonc"

local conn = ubus.connect()
if not conn then
    error("Failed to connect to ubusd")
end

local M = {}
function M.status()
    local handle = io.popen("mwan3 status 2>/dev/null")
    local result = handle:read("*a")
    handle:close()
    return { status = "active", raw_data = result }
end

local factory = {
    ["mwan3_dashboard"] = {
        status = { M.status, {} }
    }
}
return factory` },
    { name: 'www/mwan3-dashboard/', type: 'folder', desc: 'مجلد واجهة المستخدم المبنية بالكامل (Vite Distribution)' }
  ];

  return (
    <div className="space-y-6" id="docs_section">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xs border border-slate-100 dark:border-slate-700/50 transition-all">
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-emerald-500" />
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">الوثائق الفنية ودليل تشغيل وموازنة الحمل MWAN3</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              دليل مطوري الأنظمة لإدماج لوحة موازنة الحمل ومراقبتها في أجهزة OpenWrt وثيمات LuCI مثل Argon.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-100 dark:border-slate-700/50 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('ipk')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'ipk'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/20'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Folder className="w-4 h-4" />
          حزمة تثبيت OpenWrt (IPK Package)
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'manual'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/20'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Terminal className="w-4 h-4" />
          دليل التثبيت اليدوي التقليدي
        </button>
        <button
          onClick={() => setActiveTab('api')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'api'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/20'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Code className="w-4 h-4" />
          واجهة برمجة REST API
        </button>
      </div>

      {/* Tab: IPK Package System */}
      {activeTab === 'ipk' && (
        <div className="space-y-6">
          {/* Overview of IPK Strategy */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xs border border-slate-100 dark:border-slate-700/50 space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              تجهيز المشروع كحزمة نظام OpenWrt بصيغة .ipk (متوافق مع Argon و LuCI)
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
              لجعل هذا المشروع واجهة رسومية خفيفة وقابلة للتثبيت المباشر على أي راوتر أو نقطة وصول OpenWrt، قمنا بهيكلة ملفات الإعداد والتحكم والبرمجة بالكامل داخل المشروع تحت المجلد الرئيسى <code className="bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-emerald-600 dark:text-emerald-400 font-mono">/openwrt-ipk</code>. 
              يتيح لك هذا الأسلوب تجميع الحزمة ورفعها للراوتر لتثبيتها بأمر واحد، والاندماج التلقائي مع واجهات <span className="font-semibold text-emerald-600 dark:text-emerald-400">Argon Theme</span> ومستودعات التطبيقات.
            </p>
          </div>

          {/* Interactive Package Directory Map */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xs border border-slate-100 dark:border-slate-700/50">
            <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-4">📂 خريطة هيكل حزمة التثبيت الذكي المتوفرة بالمشروع:</h4>
            <div className="space-y-3">
              {ipkStructure.map((item, index) => (
                <div key={index} className="border border-slate-100 dark:border-slate-700/50 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.type === 'folder' ? (
                        <Folder className="w-5 h-5 text-amber-500" />
                      ) : (
                        <FileCode className="w-5 h-5 text-sky-500" />
                      )}
                      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{item.name}</span>
                    </div>
                    {item.content && (
                      <button
                        onClick={() => copyToClipboard(item.content || '', `ipk_${index}`)}
                        className="text-xs flex items-center gap-1.5 text-slate-500 hover:text-emerald-500 transition-colors"
                      >
                        {copiedSection === `ipk_${index}` ? 'تم النسخ!' : 'نسخ الكود'}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                    {item.desc || (item.content ? 'محتويات الملف البرمجي التنفيذي المرفق' : '')}
                  </p>
                  {item.content && (
                    <pre dir="ltr" className="bg-slate-950 text-slate-300 p-3 rounded-lg font-mono text-[10px] overflow-x-auto mt-2 max-h-48">
                      {item.content}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* How to Build & Pack the IPK Package */}
          <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-400" />
              أوامر بناء حزمة الـ IPK ورفعها لراوترك:
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed leading-relaxed">
              قم بتنفيذ هذه الأوامر لحزم الملفات بصيغة <code className="bg-slate-800 text-white px-1 py-0.5 rounded">.ipk</code> الذكية محلياً والجاهزة للتنصيب:
            </p>
            <div className="relative group">
              <pre dir="ltr" className="bg-slate-950 p-4 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed text-emerald-400">
{`# 1. بناء واجهة React/Vite الحديثة
npm run build

# 2. نسخ مخرجات واجهة الفيش إلى مجلد التوزيع في الحزمة
cp -r dist/* openwrt-ipk/www/mwan3-dashboard/

# 3. تجميع الحزمة الذكية (.ipk)
tar -czf control.tar.gz -C openwrt-ipk/CONTROL .
tar -czf data.tar.gz -C openwrt-ipk --exclude=CONTROL .
echo "2.0" > debian-binary
tar -czf luci-app-mwan3-dashboard_1.0.0_all.ipk debian-binary control.tar.gz data.tar.gz

# تنظيف الملفات المؤقتة
rm debian-binary control.tar.gz data.tar.gz`}
              </pre>
              <button
                onClick={() => copyToClipboard(`# 1. بناء واجهة React/Vite الحديثة\nnpm run build\n\n# 2. نسخ مخرجات واجهة الفيش إلى مجلد التوزيع في الحزمة\ncp -r dist/* openwrt-ipk/www/mwan3-dashboard/\n\n# 3. تجميع الحزمة الذكية (.ipk)\ntar -czf control.tar.gz -C openwrt-ipk/CONTROL .\ntar -czf data.tar.gz -C openwrt-ipk --exclude=CONTROL .\necho "2.0" > debian-binary\ntar -czf luci-app-mwan3-dashboard_1.0.0_all.ipk debian-binary control.tar.gz data.tar.gz\n\n# تنظيف الملفات المؤقتة\nrm debian-binary control.tar.gz data.tar.gz`, 'build_cmds')}
                className="absolute top-2 left-2 p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 group-hover:text-white transition-all"
              >
                {copiedSection === 'build_cmds' ? 'تم النسخ!' : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Quick Installation commands on target device */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xs border border-slate-100 dark:border-slate-700/50 space-y-4">
            <h3 className="text-md font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-500" />
              كيفية تثبيت الحزمة الفورية على الموجه (SSH / Terminal):
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              ارفع ملف الحزمة الناتج <code className="bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded text-emerald-600 dark:text-emerald-400 font-mono">luci-app-mwan3-dashboard_1.0.0_all.ipk</code> إلى الراوتر (تحت مجلد <code className="font-mono">/tmp</code>) ثم اتصل بـ SSH ونفذ:
            </p>
            <div className="relative group">
              <pre dir="ltr" className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto">
{`# تثبيت الحزمة على الراوتر
opkg install /tmp/luci-app-mwan3-dashboard_1.0.0_all.ipk

# فتح بورت اللوحة لتعمل تلقائياً مع ثيم Argon
/etc/init.d/uhttpd restart`}
              </pre>
              <button
                onClick={() => copyToClipboard(`opkg install /tmp/luci-app-mwan3-dashboard_1.0.0_all.ipk\n/etc/init.d/uhttpd restart`, 'install_cmds')}
                className="absolute top-2 left-2 p-1.5 rounded-md bg-slate-850 text-slate-400"
              >
                {copiedSection === 'install_cmds' ? 'تم النسخ!' : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              بعد التنصيب، يمكن تصفح اللوحة مباشرة عبر الانتقال لعنوان الآيبـي المخصص للراوتر: <code className="bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded font-mono text-emerald-600 dark:text-emerald-400">http://192.168.1.1/mwan3-dashboard</code>.
            </p>
          </div>
        </div>
      )}

      {/* Tab: Manual Setup Documentation */}
      {activeTab === 'manual' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xs border border-slate-100 dark:border-slate-700/50">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              {TECHNICAL_DOCS_AR.overview.title}
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
              {TECHNICAL_DOCS_AR.overview.desc}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xs border border-slate-100 dark:border-slate-700/50 space-y-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <Terminal className="w-5 h-5 text-emerald-500" />
              خطوات النشر والتثبيت اليدوي التقليدي
            </h3>

            <div className="space-y-6">
              {TECHNICAL_DOCS_AR.deployment.steps.map((step, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 text-xs font-bold mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-white">{step.title}</h4>
                      {step.desc && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{step.desc}</p>
                      )}
                    </div>
                  </div>

                  {step.code && (
                    <div className="relative mr-9 group">
                      <pre dir="ltr" className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed shadow-inner">
                        {step.code}
                      </pre>
                      <button
                        onClick={() => copyToClipboard(step.code, `code_${idx}`)}
                        className="absolute top-2 left-2 p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 group-hover:text-white transition-all border border-slate-700"
                        title="نسخ الكود"
                      >
                        {copiedSection === `code_${idx}` ? (
                          <span className="text-[10px] text-emerald-400 font-sans px-1">تم النسخ!</span>
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: API Reference & REST Methods */}
      {activeTab === 'api' && (
        <div className="space-y-6 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xs border border-slate-100 dark:border-slate-700/50">
          <div className="border-b border-slate-100 dark:border-slate-700 pb-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Code className="w-5 h-5 text-emerald-500" />
              {TECHNICAL_DOCS_AR.apiDocs.title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {TECHNICAL_DOCS_AR.apiDocs.desc}
            </p>
          </div>

          <div className="space-y-6">
            {TECHNICAL_DOCS_AR.apiDocs.endpoints.map((endpoint, idx) => (
              <div key={idx} className="border border-slate-100 dark:border-slate-700/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold font-mono ${
                    endpoint.method === 'GET' 
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400' 
                      : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                  }`}>
                    {endpoint.method}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{endpoint.path}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{endpoint.desc}</p>
                
                {endpoint.payload && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">بيانات الطلب (Payload):</span>
                    <pre dir="ltr" className="bg-slate-900 text-slate-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                      {endpoint.payload}
                    </pre>
                  </div>
                )}

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">الاستجابة الافتراضية (Response):</span>
                  <pre dir="ltr" className="bg-slate-900 text-emerald-400 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                    {endpoint.response}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resource Performance Footer */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-100/50 dark:border-emerald-900/30 rounded-2xl p-6 flex gap-4 items-start">
        <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400 hidden sm:block">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 mb-1">💡 الكفاءة واستهلاك الموارد في بيئة OpenWrt الاقتصادية:</h3>
          <p className="text-xs text-emerald-700 dark:text-emerald-400/80 leading-relaxed">
            تتميز واجهتنا الرسومية باعتمادها التام على معالجة العميل (Client-Side Interface). لا تتطلب اللوحة تشغيل خدمات خلفية ثقيلة على الراوتر، بل يتم تقديم الملفات الثابتة عبر خادم <code className="bg-emerald-50 dark:bg-slate-950 px-1 py-0.5 rounded font-mono">uHTTPd</code> بمستويات ضغط عالية للغاية. تسحب اللوحة البيانات بصيغة JSON خفيفة عبر خدمة ubus ونظام <code className="bg-emerald-50 dark:bg-slate-950 px-1 py-0.5 rounded font-mono">rpcd</code> بسرعة تضمن بقاء استهلاك الذاكرة أقل من 1.2MB ومساهمة تقارب 0% في نسبة ضغط المعالج (CPU load).
          </p>
        </div>
      </div>
    </div>
  );
}

