/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NetworkInterface, AlertLog, APIToken, UpdateFeed, DashboardWidget, SystemMetrics } from './types';

export const INITIAL_INTERFACES: NetworkInterface[] = [
  {
    id: 'wan1',
    name: 'WAN1_Fiber',
    type: 'fiber',
    status: 'online',
    speedUp: 45.2,
    speedDown: 180.5,
    latency: 12,
    loss: 0,
    weight: 3,
    priority: 1,
    enabled: true,
    trackingIps: ['1.1.1.1', '8.8.8.8'],
    uptime: 86450,
    device: 'eth0.2'
  },
  {
    id: 'wan2',
    name: 'WAN2_DSL',
    type: 'dsl',
    status: 'online',
    speedUp: 10.4,
    speedDown: 40.1,
    latency: 32,
    loss: 0.2,
    weight: 1,
    priority: 1,
    enabled: true,
    trackingIps: ['8.8.4.4', '208.67.222.222'],
    uptime: 124500,
    device: 'pppoe-wan'
  },
  {
    id: 'lte',
    name: 'WAN3_LTE_Backup',
    type: 'lte',
    status: 'degraded',
    speedUp: 5.1,
    speedDown: 15.6,
    latency: 85,
    loss: 2.4,
    weight: 1,
    priority: 2,
    enabled: true,
    trackingIps: ['1.1.1.1', '8.8.8.8'],
    uptime: 12510,
    device: 'usb0'
  }
];

export const INITIAL_ALERTS: AlertLog[] = [
  {
    id: 'a1',
    timestamp: '2026-06-10T18:12:00Z',
    level: 'info',
    message: 'تم تشغيل نظام موازنة الحمل MWAN3 بنجاح وتفعيل سياسات التوزيع.',
    resolved: true
  },
  {
    id: 'a2',
    timestamp: '2026-06-10T19:30:12Z',
    level: 'warning',
    interfaceId: 'lte',
    message: 'واجهة الاتصال WAN3_LTE_Backup تشهد ارتفاعاً في نسبة فقدان الحزم (2.4%).',
    resolved: false
  }
];

export const INITIAL_TOKENS: APIToken[] = [
  {
    id: 'tok1',
    name: 'لوحة المراقبة المنزلية HomeAssistant',
    token: 'mwan3_live_tkn_81a7d6bc201ffc',
    scope: 'read',
    createdAt: '2026-06-01T10:00:00Z'
  },
  {
    id: 'tok2',
    name: 'نظام التحكم الداخلي بالشبكة Main_Router_Admin',
    token: 'mwan3_live_tkn_fb921aa21398bb',
    scope: 'admin',
    createdAt: '2026-06-05T14:24:00Z'
  }
];

export const INITIAL_UPDATES: UpdateFeed[] = [
  {
    id: 'u1',
    type: 'security',
    version: '2.8.15-p2',
    date: '2026-06-08',
    title: 'تحديث أمني عاجل لثغرة LuCI CSRF',
    description: 'تم العثور على ثغرة أمنية تسمح بتمرير أوامر مشبوهة عبر متصفح الويب لبعض حزم موازنة الأحمال. هذا التحديث يحل المشكلة بالكامل عن طريق تفعيل طبقة تحقق جديدة (CSRF token verification) للطلب.',
    severity: 'critical',
    applied: false
  },
  {
    id: 'u2',
    type: 'feature',
    version: '2.8.20',
    date: '2026-05-20',
    title: 'تحديث ميزة قياس الأداء وتتبع عناوين IPv6',
    description: 'دعم تتبع صحة خطوط الاتصال عبر عناوين IPv6 المتعددة، وتحسين إدارة الموارد لمعالج ميكرو MIPS32.',
    severity: 'medium',
    applied: true
  },
  {
    id: 'u3',
    type: 'system',
    version: '2.8.21-rc1',
    date: '2026-06-09',
    title: 'تحديث اختياري لتحسين أداء جدولة حزم الاتصال',
    description: 'تقليل استهلاك الذاكرة العشوائية بنسبة 18% عند استخدام أكثر من 4 واجهات اتصال نشطة في نفس الوقت.',
    severity: 'low',
    applied: false
  }
];

export const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'interfaces_summary', titleEn: 'Interfaces Summary', titleAr: 'ملخص واجهات الاتصال', visible: true, order: 1 },
  { id: 'traffic_distribution', titleEn: 'Traffic Distribution', titleAr: 'توزيع حركة المرور', visible: true, order: 2 },
  { id: 'speed_monitor', titleEn: 'Real-time Speedometer', titleAr: 'مؤشرات السرعة الفورية', visible: true, order: 3 },
  { id: 'mwan3_report', titleEn: 'Connection Status Reports', titleAr: 'تقارير جودة وحالة الاتصال', visible: true, order: 4 },
  { id: 'system_footprint', titleEn: 'Router Resources Footprint', titleAr: 'استهلاك موارد الراوتر', visible: true, order: 5 },
  { id: 'quick_actions', titleEn: 'Interactive Simulations & Controls', titleAr: 'أدوات التحكم ومحاكاة الأعطال', visible: true, order: 6 }
];

export const INITIAL_SYSTEM_METRICS: SystemMetrics = {
  cpuUsage: 14.5,
  ramUsage: 35.8,
  temp: 48.0,
  activeConnections: 1420,
  mwan3Uptime: 224560
};

export const INITIAL_CONFIG_CONTENT = `config globals 'globals'
\toption mmx_mask '0x3F00'
\toption local_source 'lan'

config interface 'wan1'
\toption enabled '1'
\tlist track_ip '1.1.1.1'
\tlist track_ip '8.8.8.8'
\toption reliability '1'
\toption count '1'
\toption timeout '2'
\toption interval '5'
\toption down '3'
\toption up '8'

config interface 'wan2'
\toption enabled '1'
\tlist track_ip '8.8.4.4'
\tlist track_ip '208.67.222.222'
\toption reliability '1'
\toption count '1'
\toption timeout '3'
\toption interval '5'
\toption down '3'
\toption up '8'

config interface 'lte'
\toption enabled '1'
\tlist track_ip '1.1.1.1'
\tlist track_ip '8.8.8.8'
\toption reliability '1'
\toption count '1'
\toption timeout '4'
\toption interval '10'
\toption down '5'
\toption up '5'

config member 'wan1_m1_w3'
\toption interface 'wan1'
\toption metric '1'
\toption weight '3'

config member 'wan2_m1_w1'
\toption interface 'wan2'
\toption metric '1'
\toption weight '1'

config member 'lte_m2_w1'
\toption interface 'lte'
\toption metric '2'
\toption weight '1'

config policy 'balanced_policy'
\tlist use_member 'wan1_m1_w3'
\tlist use_member 'wan2_m1_w1'
\tlist use_member 'lte_m2_w1'
\toption last_resort 'unreachable'

config rule 'default_rule'
\toption dest_ip '0.0.0.0/0'
\toption use_policy 'balanced_policy'
`;

export const TECHNICAL_DOCS_AR = {
  overview: {
    title: 'نظرة عامة على موازنة التحميل (MWAN3)',
    desc: 'تعتمد أجهزة OpenWrt على واجهة mwan3 لتوحيد خطوط إنترنت متعددة وضمان فاعليتها والتحويل التلقائي عند انقطاع أحد الخطوط. تقوم الأداة بإجراء اختبارات دورية (Ping) للاتصال بعناوين خوادم موثوقة للتحقق من سلامة وجودة الربط.'
  },
  deployment: {
    title: 'تثبيت لوحة التحكم على OpenWrt',
    steps: [
      {
        title: 'تنصيب المكونات الأساسية على الراوتر بالطرفية (SSH):',
        code: 'opkg update\nopkg install mwan3 lucl-app-mwan3 uhttpd'
      },
      {
        title: 'رفع ملفات واجهة الويب الخفيفة:',
        desc: 'بما أن واجهتنا مصممة خصيصاً لتكون ثابتة وخفيفة (Static Dashboard) ولا تستهلك موارداً إضافية، يتم ببساطة وضع الملفات التي تم إنشاؤها بعد تفعيل أمر البناء (HTML, JS, CSS) في دليل ويب uHTTPd على المسار التالي:',
        code: 'mkdir -p /www/mwan3_dashboard\n# انسخ ملفات مجلد dist إلى الراوتر باستخدام scp\nscp -r dist/* root@192.168.1.1:/www/mwan3_dashboard/'
      },
      {
        title: 'تكامل واجهة برمجة التطبيقات (API) ومزامنة البيانات:',
        desc: 'يتم تشغيل نص برمجي خفيف للغاية (Shell Script) يُدعى عبر Cron Job ليقوم بتحديث الحالة الحالية وإرسالها إما لـ Local Storage أو ملف JSON يتم قراءته وتحديث واجهتنا بناءً عليه، مما يمثل عبء 0% فعلياً على معالج الراوتر:',
        code: '#!/bin/sh\nST_WAN1=$(mwan3 status | grep -A 4 wan1)\nST_WAN2=$(mwan3 status | grep -A 4 wan2)\n# ثم يتم صياغته بتنسيق JSON وحفظه في /www/mwan3_dashboard/status.json'
      }
    ]
  },
  apiDocs: {
    title: 'وثائق واجهة برمجة التطبيقات (REST API)',
    desc: 'توفر لوحة التحكم واجهات برمجية خفيفة وقابلة للتكامل مع الأنظمة الخارجية كأنظمة المراقبة (PRTG, Grafana, HomeAssistant). لتأمين البيانات، يجب تمرير التوكن المستخرج في الترويسة (Header) كـ authorization.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/mwan3/status',
        desc: 'استرجاع الحالة العامة ومؤشرات الاتصال الحالية بالملي ثانية ومستوى فقد الحزم لكافة المنافذ.',
        response: '{\n  "status": "online",\n  "interfaces": [\n    {"id": "wan1", "status": "online", "latency": 12, "loss": 0},\n    {"id": "wan2", "status": "online", "latency": 32, "loss": 0.2}\n  ]\n}'
      },
      {
        method: 'POST',
        path: '/api/mwan3/switch',
        desc: 'تفعيل أو تعطيل واجهة اتصال معينة يدوياً وتوجيه الحركة مؤقتاً.',
        payload: '{\n  "interface": "wan2",\n  "enabled": false\n}',
        response: '{\n  "success": true,\n  "msg": "Interface WAN2_DSL disabled successfully"\n}'
      }
    ]
  }
};
