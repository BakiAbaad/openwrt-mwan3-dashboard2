/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, Key, Terminal, Code, Plus, Trash, Play, AlertCircle, Copy, UserCheck } from 'lucide-react';
import { APIToken, UserRole } from '../types';
import { INITIAL_TOKENS, TECHNICAL_DOCS_AR } from '../data';

interface APIViewProps {
  role: UserRole;
}

export default function APIView({ role }: APIViewProps) {
  const [tokens, setTokens] = useState<APIToken[]>(INITIAL_TOKENS);
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenScope, setNewTokenScope] = useState<'read' | 'write' | 'admin'>('read');
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  // API sandbox state
  const [selectedEndpoint, setSelectedEndpoint] = useState(0);
  const [selectedTokenInSandbox, setSelectedTokenInSandbox] = useState(tokens[0]?.token || 'mwan3_live_tkn_demo');
  const [apiResponse, setApiResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);

  const handleGenerateToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'viewer') {
      alert('عذراً، بصفتك مراجعاً (Viewer) لا تملك الصلاحية لإنتاج مفاتيح برمجية جديدة.');
      return;
    }
    if (!newTokenName.trim()) return;

    const randomSuffix = Math.random().toString(16).substring(2, 16);
    const generatedToken: APIToken = {
      id: `tok${Date.now()}`,
      name: newTokenName,
      token: `mwan3_live_tkn_${randomSuffix}`,
      scope: newTokenScope,
      createdAt: new Date().toISOString()
    };

    setTokens([generatedToken, ...tokens]);
    setNewTokenName('');
    setSelectedTokenInSandbox(generatedToken.token);
  };

  const handleDeleteToken = (id: string) => {
    if (role === 'viewer') {
      alert('عذراً، لا تملك الصلاحية لحذف المفاتيح البرمجية.');
      return;
    }
    setTokens(tokens.filter(t => t.id !== id));
  };

  const copyTokenText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTokenId(id);
    setTimeout(() => setCopiedTokenId(null), 2000);
  };

  const endpoints = TECHNICAL_DOCS_AR.apiDocs.endpoints;

  const runApiCall = () => {
    setIsLoading(true);
    setApiResponse('');
    
    // Simulate API delay
    setTimeout(() => {
      const selectedEp = endpoints[selectedEndpoint];
      if (!selectedTokenInSandbox) {
        setApiResponse(JSON.stringify({ error: "Unauthorized", message: "Missing or invalid token in request header." }, null, 2));
      } else {
        const parsedRes = JSON.parse(selectedEp.response);
        // Inject dynamic values if relevant
        setApiResponse(JSON.stringify({
          ...parsedRes,
          _simulated_headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${selectedTokenInSandbox}`,
            "X-Device": "OpenWrt-Router-MWAN3"
          },
          _timestamp: new Date().toISOString()
        }, null, 2));
      }
      setIsLoading(false);
    }, 850);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  // Generate the cURL command for display
  const currentEp = endpoints[selectedEndpoint];
  const curlCommand = `curl -X ${currentEp.method} \\
  -H "Authorization: Bearer ${selectedTokenInSandbox || '<YOUR_TOKEN>'}" \\
  -H "Content-Type: application/json" \\
  ${currentEp.payload ? `-d '${currentEp.payload.replace(/\n\s*/g, '')}' \\ \n  ` : ''}https://192.168.1.1${currentEp.path}`;

  return (
    <div className="space-y-6" id="api_panel_view">
      {/* Overview Block */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xs border border-slate-100 dark:border-slate-700/50">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-indigo-500" />
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">واجهات البرمجة ومفاتيح الاتصال (API Client)</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              ربط وتكوين الأنظمة الخارجية كالحوسبة السحابية وأنظمة المراقبة الذكية عبر مفاتيح برمجية مميكنة وآمنة.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* API Tokens Manager */}
        <div className="col-span-1 lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-xs border border-slate-100 dark:border-slate-700/50">
            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <Key className="w-4 h-4 text-indigo-500" />
              إدارة مفاتيح الاتصال (REST Tokens)
            </h3>

            {role === 'viewer' ? (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-400 p-3.5 rounded-xl text-xs flex gap-2.5 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>أنت مسجل حالياً بصلاحيات <strong>مراقب (Viewer)</strong>. لا يمكنك تعديل أو إصدار مفاتيح برمجية جديدة.</span>
              </div>
            ) : (
              <form onSubmit={handleGenerateToken} className="space-y-3.5 mb-5 border-b border-slate-100 dark:border-slate-700/50 pb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">اسم المفتاح البرمجي</label>
                  <input
                    type="text"
                    value={newTokenName}
                    onChange={(e) => setNewTokenName(e.target.value)}
                    placeholder="مثال: لوحة تحكم Grafana الرئيسية"
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-150 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">مستوى الصلاحية (Scope)</label>
                  <select
                    value={newTokenScope}
                    onChange={(e) => setNewTokenScope(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-150 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="read">قراءة فقط (Read Info)</option>
                    <option value="write">كتابة وتشغيل (Control API)</option>
                    <option value="admin">صلاحيات كاملة للراوتر (Super Admin)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full text-xs py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  إنتاج مفتاح اتصال جديد
                </button>
              </form>
            )}

            {/* List of active tokens */}
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
              {tokens.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">لا توجد مفاتيح نشطة حالياً.</p>
              ) : (
                tokens.map(tk => (
                  <div key={tk.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{tk.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        tk.scope === 'admin' ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400' :
                        tk.scope === 'write' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400' :
                        'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400'
                      }`}>
                        {tk.scope === 'admin' ? 'مدير' : tk.scope === 'write' ? 'تحكم' : 'قراءة'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={tk.token}
                        type="password"
                        className="flex-1 bg-white dark:bg-slate-800 text-[10px] font-mono p-1.5 rounded-md border border-slate-100 dark:border-slate-700 text-slate-500"
                        title="مخفي لسرية الأمان"
                      />
                      <button
                        onClick={() => copyTokenText(tk.token, tk.id)}
                        className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-slate-500"
                        title="نسخ الرمز"
                      >
                        {copiedTokenId === tk.id ? (
                          <span className="text-[9px] text-emerald-500 font-bold">تم!</span>
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteToken(tk.id)}
                        disabled={role === 'viewer'}
                        className="p-1.5 rounded-md hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 text-slate-400 transition-all cursor-pointer disabled:opacity-40"
                        title="حذف الرمز"
                      >
                        <Trash className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* REST API Playground Sandbox */}
        <div className="col-span-1 lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-xs border border-slate-100 dark:border-slate-700/50 space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-500" />
              منصة الاختبار التجريبي (API Playground Sandbox)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">اختر نقطة النهاية (Endpoint)</label>
                <select
                  value={selectedEndpoint}
                  onChange={(e) => {
                    setSelectedEndpoint(Number(e.target.value));
                    setApiResponse('');
                  }}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-150 focus:outline-hidden"
                >
                  {endpoints.map((ep, idx) => (
                    <option key={idx} value={idx}>
                      [{ep.method}] {ep.path}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">استخدم رمز المصادقة (Auth Token)</label>
                <select
                  value={selectedTokenInSandbox}
                  onChange={(e) => setSelectedTokenInSandbox(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-150 focus:outline-hidden"
                >
                  <option value="">-- بدون رمز مصادقة (فشل بالاتصال) --</option>
                  {tokens.map(tk => (
                    <option key={tk.id} value={tk.token}>
                      {tk.name} ({tk.token.substring(0, 15)}...)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description or Payload details */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-850">
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                🔔 الوصف: <span className="font-normal text-slate-500 dark:text-slate-400">{currentEp.desc}</span>
              </p>
              {currentEp.payload && (
                <div className="mt-2.5">
                  <span className="block text-[10px] font-bold text-indigo-500 mb-1">Payload (JSON body):</span>
                  <pre className="bg-slate-100 dark:bg-slate-900 p-2 text-[10px] font-mono rounded-md overflow-x-auto text-slate-600 dark:text-slate-300 leading-normal">
                    {currentEp.payload}
                  </pre>
                </div>
              )}
            </div>

            {/* Simulated cURL Panel */}
            <div className="space-y-1.5">
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-indigo-400" />
                أمر cURL الفعلي:
              </span>
              <div className="relative group">
                <pre dir="ltr" className="bg-slate-950 text-indigo-400 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed shadow-inner">
                  {curlCommand}
                </pre>
              </div>
            </div>

            {/* Trigger Button */}
            <div className="flex justify-end pt-1">
              <button
                onClick={runApiCall}
                disabled={isLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                {isLoading ? (
                  <span className="flex items-center gap-1.5 animate-pulse">
                    جارِ المعالجة وتحليل التوكن...
                  </span>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    تشغيل الطلب التجريبي الفوري
                  </>
                )}
              </button>
            </div>

            {/* Response Console */}
            {apiResponse && (
              <div className="space-y-1.5 border-t border-slate-150 dark:border-slate-700/60 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-indigo-500" />
                    استجابة بروتوكول LuCI (JSON Response):
                  </span>
                  <button
                    onClick={() => copyToClipboard(apiResponse)}
                    className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
                  >
                    {copiedResponse ? 'تم نسخ المخرجات!' : 'نسخ الاستجابة'}
                  </button>
                </div>
                <pre dir="ltr" className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-[10px] sm:text-xs overflow-x-auto leading-relaxed max-h-[220px] shadow-inner">
                  {apiResponse}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
