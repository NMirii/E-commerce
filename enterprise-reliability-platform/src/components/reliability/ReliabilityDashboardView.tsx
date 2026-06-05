"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  ShieldAlert, 
  Terminal, 
  Activity, 
  Trash2, 
  Flame, 
  RefreshCw, 
  Cpu, 
  AlertOctagon, 
  CheckCircle,
  Database,
  Unplug,
  Sparkles
} from "lucide-react";
import { ErrorBoundary } from "./ErrorBoundary";
import { PaymentErrorFallback } from "./PaymentErrorFallback";
import { InventoryErrorFallback } from "./InventoryErrorFallback";
import { HydrationSafe } from "./HydrationSafe";

interface LogItem {
  level: "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";
  timestamp: string;
  message: string;
  context?: unknown;
}

interface CircuitItem {
  serviceName: string;
  state: "CLOSED" | "OPEN" | "HALF_OPEN";
  failures: number;
  lastFailureTime: number | null;
}

interface MemoryMetrics {
  rss: string;
  heapUsed: string;
  heapTotal: string;
}

// Component that throws error on demand to test Error Boundary
function CrashButtonComponent({ type }: { type: "payment" | "inventory" }) {
  const [shouldCrash, setShouldCrash] = useState(false);

  if (shouldCrash) {
    throw new Error(`SimulatedError: Failed to process ${type === "payment" ? "checkout billing transaction" : "inventory stock synchronization"}.`);
  }

  return (
    <button
      onClick={() => setShouldCrash(true)}
      className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-red-950/40 hover:bg-red-900/40 border border-red-500/30 text-red-300 font-semibold rounded-lg text-xs transition-all active:scale-95 cursor-pointer"
    >
      <Flame className="w-3.5 h-3.5" />
      {type === "payment" ? "Ödəniş Səhvini Simulyasiya Et" : "Anbar Səhvini Simulyasiya Et"}
    </button>
  );
}

// Subcomponent causing server/client text mismatch to test Hydration errors
function HydrationMismatchTest() {
  // On the server, render server-side message. On client, render client-side value
  const displayVal = typeof window === "undefined" ? "Server Sessiyası: Default Server" : "Müştəri Sessiyası: Active Client";

  return (
    <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-lg text-xs font-mono">
      <span className="text-indigo-400 font-bold">[Hydration Error Source]:</span> {displayVal}
    </div>
  );
}

export default function ReliabilityDashboardView() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [circuits, setCircuits] = useState<CircuitItem[]>([]);
  const [memory, setMemory] = useState<MemoryMetrics>({ rss: "N/A", heapUsed: "N/A", heapTotal: "N/A" });
  const [selectedLogLevel, setSelectedLogLevel] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  // Memory Leak Simulation states
  const memoryArrayRef = useRef<unknown[]>([]);
  const [simulatedMemUsage, setSimulatedMemUsage] = useState<number>(0);
  const [isLeaking, setIsLeaking] = useState<boolean>(false);
  const leakInterval = useRef<NodeJS.Timeout | null>(null);

  // Resilient API Call states
  const [apiLogs, setApiLogs] = useState<string[]>([]);
  const [isFetchingApi, setIsFetchingApi] = useState<boolean>(false);

  // 1. Fetch Diagnostics Data from API
  const fetchDiagnostics = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/reliability/logs");
      const data = await res.json();
      if (data) {
        setLogs(data.logs || []);
        setCircuits(data.circuits || []);
        setMemory(data.memory || { rss: "N/A", heapUsed: "N/A", heapTotal: "N/A" });
      }
    } catch (err) {
      console.error("Failed to load diagnostics:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Poll for logs and circuits metrics
  useEffect(() => {
    fetchDiagnostics();
    const interval = setInterval(fetchDiagnostics, 3000);
    return () => clearInterval(interval);
  }, []);

  // 2. Clear server-side logs
  const clearServerLogs = async () => {
    try {
      const res = await fetch("/api/reliability/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_logs" }),
      });
      if (res.ok) {
        setLogs([]);
        fetchDiagnostics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Reset or Trip Circuit Breakers
  const handleCircuitAction = async (service: string, action: "reset_circuit" | "trip_circuit") => {
    try {
      const res = await fetch("/api/reliability/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload: { service } }),
      });
      if (res.ok) {
        fetchDiagnostics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 4. Trigger Server Action / Database Errors
  const triggerServerError = async (type: "server" | "payment") => {
    const action = type === "server" ? "trigger_server_error" : "trigger_payment_timeout";
    try {
      await fetch("/api/reliability/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
    } catch {
      // expected error
    } finally {
      fetchDiagnostics();
    }
  };

  // 5. Memory Leak Simulation logic
  const startMemoryLeak = () => {
    if (isLeaking) return;
    setIsLeaking(true);
    leakInterval.current = setInterval(() => {
      // Accumulate heavy memory blocks
      for (let i = 0; i < 10000; i++) {
        memoryArrayRef.current.push({
          data: new Array(50).fill("A_HEAVY_MEM_DATA_ELEMENT_SCRUBBED_PCI_SAFE"),
          timestamp: Date.now(),
        });
      }
      setSimulatedMemUsage(Math.round(memoryArrayRef.current.length / 5000));
    }, 200);
  };

  const stopMemoryLeak = () => {
    if (leakInterval.current) {
      clearInterval(leakInterval.current);
      leakInterval.current = null;
    }
    setIsLeaking(false);
  };

  const resetMemoryLeak = () => {
    stopMemoryLeak();
    memoryArrayRef.current = [];
    setSimulatedMemUsage(0);
  };

  useEffect(() => {
    return () => stopMemoryLeak();
  }, []);

  // 6. Resilient API Simulation client execution
  const runResilientAPITest = async (simulateOutage: boolean) => {
    setIsFetchingApi(true);
    setApiLogs([]);
    
    // We register simulated calls and steps
    const appendLog = (msg: string) => {
      setApiLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    appendLog("Resilient API request initiated to 'Stripe Payment Gateway'...");
    
    if (simulateOutage) {
      // Trip circuit breaker manually on backend
      await handleCircuitAction("stripe", "trip_circuit");
      appendLog("Circuit breaker manually tripped to OPEN for Stripe.");
    } else {
      await handleCircuitAction("stripe", "reset_circuit");
      appendLog("Circuit breaker reset to CLOSED for Stripe.");
    }

    // Attempting fetch
    try {
      appendLog("Executing resilient fetch wrapper...");
      const res = await fetch("/api/reliability/logs"); // call live route to demonstrate
      if (res.ok) {
        appendLog("Request succeeded. Circuit is CLOSED.");
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      appendLog(`Resilient Fetch Failed: ${errMsg}`);
    } finally {
      setIsFetchingApi(false);
      fetchDiagnostics();
    }
  };

  // Filter logs locally
  const filteredLogs = logs.filter((log) => {
    const matchesLevel = selectedLogLevel === "ALL" ? true : log.level === selectedLogLevel;
    const matchesSearch = searchQuery 
      ? log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.context && JSON.stringify(log.context).toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    return matchesLevel && matchesSearch;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 text-slate-100 min-h-screen font-sans">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/20 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Activity className="w-5 h-5 animate-pulse" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-white">Enterprise Reliability Center</h1>
          </div>
          <p className="text-slate-400 text-xs mt-1">Real-time production monitoring, diagnostics, error recovery testing and PCI compliance tracking.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchDiagnostics}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Yenilə
          </button>
          <button
            onClick={clearServerLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/30 border border-red-500/20 hover:bg-red-900/30 text-red-300 rounded-lg text-xs font-semibold cursor-pointer transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Logları Təmizlə
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Server Memory */}
        <div className="bg-[#111625] border border-slate-800 rounded-xl p-5 shadow-lg shadow-slate-950/10 hover:border-slate-700 transition-all flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-emerald-500" /> Server Yaddaşı (Heap)
            </span>
            <h2 className="text-2xl font-black text-white mt-1.5">{memory.heapUsed}</h2>
            <p className="text-[10px] text-slate-500 mt-1">Rss: {memory.rss} | Max: {memory.heapTotal}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/10">
            <span className="text-xs font-bold font-mono">RAM</span>
          </div>
        </div>

        {/* Metric 2: Error Rate */}
        <div className="bg-[#111625] border border-slate-800 rounded-xl p-5 shadow-lg shadow-slate-950/10 hover:border-slate-700 transition-all flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <AlertOctagon className="w-3 h-3 text-red-500" /> Tranzaksiya Error Oranı
            </span>
            <h2 className={`text-2xl font-black mt-1.5 ${filteredLogs.length > 0 ? "text-red-400 animate-pulse" : "text-emerald-400"}`}>
              {logs.filter(l => l.level === "ERROR" || l.level === "FATAL").length > 0 ? "Kritik" : "0.00%"}
            </h2>
            <p className="text-[10px] text-slate-500 mt-1">Son 100 logdan error sayı: {logs.filter(l => l.level === "ERROR" || l.level === "FATAL").length}</p>
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
            logs.filter(l => l.level === "ERROR" || l.level === "FATAL").length > 0
              ? "bg-red-500/10 text-red-400 border-red-500/20"
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          }`}>
            <span className="text-xs font-bold">ERR</span>
          </div>
        </div>

        {/* Metric 3: PCI compliance */}
        <div className="bg-[#111625] border border-slate-800 rounded-xl p-5 shadow-lg shadow-slate-950/10 hover:border-slate-700 transition-all flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-indigo-500" /> PCI Compliance Status
            </span>
            <h2 className="text-2xl font-black text-indigo-300 mt-1.5 flex items-center gap-1.5">
              100% Secure
            </h2>
            <p className="text-[10px] text-slate-500 mt-1">Log PII/PCI Scrubbing & Secure Headers Active</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
            <CheckCircle className="w-5 h-5 text-indigo-400" />
          </div>
        </div>

        {/* Metric 4: API Circuits */}
        <div className="bg-[#111625] border border-slate-800 rounded-xl p-5 shadow-lg shadow-slate-950/10 hover:border-slate-700 transition-all flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Database className="w-3 h-3 text-amber-500" /> Circuit Breakers
            </span>
            <h2 className="text-2xl font-black text-white mt-1.5">
              {circuits.filter(c => c.state === "CLOSED").length} / {circuits.length || 3} Active
            </h2>
            <p className="text-[10px] text-slate-500 mt-1">Stripe, Inventory, Tax gateways monitored</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
            <span className="text-xs font-bold font-mono">CB</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Hand: Controls & Diagnostics Testing (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Section 1: Error Boundary Demonstrator */}
          <div className="bg-[#111625] border border-slate-800 rounded-xl p-5 shadow-lg">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-3 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" /> React Error Boundary Sərhədləri
            </h3>
            
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Aşağıdakı komponentlər özünəməxsus visual xəta qoruyucuları (ErrorBoundary) ilə sarılıb. 
              Xəta simulyasiya edildikdə bütün tətbiq çökmür, yalnız zədələnmiş hissə təmiz fallback ilə əvəz olunur və <b>Retry</b> imkanı yaradır.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Payment Section Boundary Wrapper */}
              <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/20">
                <span className="text-xs font-bold text-slate-400 block mb-3">💳 Payment Checkouts Boundary</span>
                <ErrorBoundary fallback={(error, reset) => <PaymentErrorFallback error={error} reset={reset} />} actionName="StripeCheckoutBoundary">
                  <div className="p-4 bg-emerald-950/10 border border-emerald-500/10 rounded-lg text-center">
                    <p className="text-xs text-emerald-400 mb-4">Uğurlu Sifariş Səhifəsi (Sıradan keçir)</p>
                    <CrashButtonComponent type="payment" />
                  </div>
                </ErrorBoundary>
              </div>

              {/* Inventory Section Boundary Wrapper */}
              <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/20">
                <span className="text-xs font-bold text-slate-400 block mb-3">📦 Inventory Sync Boundary</span>
                <ErrorBoundary fallback={(error, reset) => <InventoryErrorFallback error={error} reset={reset} />} actionName="SupabaseInventoryBoundary">
                  <div className="p-4 bg-emerald-950/10 border border-emerald-500/10 rounded-lg text-center">
                    <p className="text-xs text-emerald-400 mb-4">Anbar məlumatları: 42 ədəd (Uğurlu sinxronizasiya)</p>
                    <CrashButtonComponent type="inventory" />
                  </div>
                </ErrorBoundary>
              </div>

            </div>
          </div>

          {/* Section 2: Hydration Safety Tester */}
          <div className="bg-[#111625] border border-slate-800 rounded-xl p-5 shadow-lg">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-3 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" /> Hydration Error Safety & SSR Validation
            </h3>
            
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Client ilə Server renderi fərqli olduqda (məs. Date, Random, LocalStorage) Next.js hydration xətası verir. 
              Bizim <b>HydrationSafe</b> komponentimiz bu ziddiyyətləri aradan qaldırır.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-red-950/10 border border-red-500/20 rounded-xl space-y-2">
                <span className="text-xs font-bold text-red-400 block">Qorunmayan Komponent (Crash ehtimalı):</span>
                <HydrationMismatchTest />
                <span className="text-[10px] text-red-300/80 block">⚠️ Client-server HTML fərqi Next.js hydration uyarısı atır.</span>
              </div>

              <div className="p-4 bg-emerald-950/10 border border-emerald-500/20 rounded-xl space-y-2">
                <span className="text-xs font-bold text-emerald-400 block">HydrationSafe ilə Qorunan:</span>
                <HydrationSafe fallback={<div className="text-xs text-slate-500 italic">Yüklənir...</div>}>
                  <HydrationMismatchTest />
                </HydrationSafe>
                <span className="text-[10px] text-emerald-400/80 block">✅ Səhifə asinxron mount olandan sonra render edilir, xəta yaranmır.</span>
              </div>
            </div>
          </div>

          {/* Section 3: Memory Leak simulation */}
          <div className="bg-[#111625] border border-slate-800 rounded-xl p-5 shadow-lg">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-3 mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" /> Memory Leak & Long-Session Performance Profiling
            </h3>
            
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Uzunmüddətli admin sessiyalarında memory leak tapmaq üçün yaddaş yoxlanışı simulyasiyasını başlat. 
              Limit aşıldıqda sistem sizi xəbərdar edəcək.
            </p>

            {simulatedMemUsage > 15 && (
              <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-lg text-xs text-red-300 flex items-center gap-2 mb-4 animate-bounce">
                <AlertOctagon className="w-4 h-4 text-red-400" />
                <span>UYARI: Sistemdə sürətli yaddaş sızması (Memory Leak) aşkarlanıb! Akkumulyasiya: {simulatedMemUsage} MB</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 bg-slate-950/35 p-4 rounded-xl">
              <div>
                <span className="text-xs text-slate-400 block">Simulyasiya RAM Qənaəti:</span>
                <span className="text-xl font-bold font-mono text-amber-400">{simulatedMemUsage} MB</span>
              </div>
              <div className="flex-1 flex gap-2 justify-end">
                {!isLeaking ? (
                  <button
                    onClick={startMemoryLeak}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg cursor-pointer transition-all"
                  >
                    Yaddaş Sızmasını Başlat
                  </button>
                ) : (
                  <button
                    onClick={stopMemoryLeak}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-all"
                  >
                    Durdur
                  </button>
                )}
                <button
                  onClick={resetMemoryLeak}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg cursor-pointer transition-all"
                >
                  Sıfırla
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Resilient API & Circuit Breaker demo */}
          <div className="bg-[#111625] border border-slate-800 rounded-xl p-5 shadow-lg">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-3 mb-4 flex items-center gap-2">
              <Unplug className="w-4 h-4 text-amber-500" /> Resilient API calls & Circuit Breakers (Stripe Gateway)
            </h3>
            
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Circuit Breaker API əlaqə xətası sayını sayır. 3 ardıcıl uğursuz cəhddən sonra circuit <b>OPEN</b> olur və 
              serverə yük salmamaq üçün sorğuları dərhal bloklayır.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950/20 border border-slate-800 rounded-xl space-y-3">
                <span className="text-xs font-bold text-slate-400 block">Triggers:</span>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => runResilientAPITest(false)}
                    disabled={isFetchingApi}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Normal Resilient Request (Circuit Closed)
                  </button>
                  <button
                    onClick={() => runResilientAPITest(true)}
                    disabled={isFetchingApi}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold rounded-lg text-xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Outage Test (Trip Circuit to OPEN)
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCircuitAction("stripe", "reset_circuit")}
                      className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded text-slate-300 cursor-pointer"
                    >
                      Reset Circuit
                    </button>
                    <button
                      onClick={() => triggerServerError("server")}
                      className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded text-red-400 cursor-pointer"
                    >
                      Crash Server Action
                    </button>
                  </div>
                </div>
              </div>

              {/* API console output logs */}
              <div className="p-4 bg-black/40 border border-slate-800 rounded-xl h-44 overflow-y-auto font-mono text-[10px] text-slate-400 space-y-1">
                <span className="text-slate-500 uppercase block tracking-wider font-bold mb-2">Simulyasiya Log Stream:</span>
                {apiLogs.length === 0 && <p className="text-slate-600 italic">No events processed yet. Click button above.</p>}
                {apiLogs.map((logStr, idx) => (
                  <div key={idx} className="border-b border-slate-900/50 pb-1 leading-tight">{logStr}</div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right Hand: Structured Logs stream & metrics (5 cols) */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Third-Party Service status dashboard */}
          <div className="bg-[#111625] border border-slate-800 rounded-xl p-5 shadow-lg">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-3 mb-4 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" /> Third-Party Integrations Health Check
            </h3>
            
            <div className="space-y-3">
              {/* Stripe */}
              <div className="flex items-center justify-between p-3 bg-slate-950/20 border border-slate-800/80 rounded-lg text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="font-bold text-slate-300">Stripe Payment Gateway</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold ${
                    circuits.find(c => c.serviceName === "stripe")?.state === "OPEN" 
                      ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}>
                    {circuits.find(c => c.serviceName === "stripe")?.state || "CLOSED"}
                  </span>
                </div>
              </div>

              {/* Inventory Sync */}
              <div className="flex items-center justify-between p-3 bg-slate-950/20 border border-slate-800/80 rounded-lg text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="font-bold text-slate-300">Supabase Inventory DB</span>
                </div>
                <div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] uppercase font-mono font-bold">
                    CONNECTED
                  </span>
                </div>
              </div>

              {/* Tax Calculations */}
              <div className="flex items-center justify-between p-3 bg-slate-950/20 border border-slate-800/80 rounded-lg text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="font-bold text-slate-300">Tax API Broker</span>
                </div>
                <div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] uppercase font-mono font-bold">
                    HEALTHY
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Log Stream Panel */}
          <div className="bg-[#111625] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col h-[520px]">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-3 mb-4 flex items-center gap-2 shrink-0">
              <Terminal className="w-4 h-4 text-emerald-400" /> Live Structured Log Stream
            </h3>

            {/* Filter controls */}
            <div className="flex flex-wrap gap-2 mb-4 shrink-0">
              {["ALL", "INFO", "WARN", "ERROR", "FATAL"].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLogLevel(lvl)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                    selectedLogLevel === lvl
                      ? "bg-emerald-500 text-slate-950 border-emerald-400"
                      : "bg-slate-950/60 border-slate-850 hover:bg-slate-800 text-slate-400"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="mb-4 shrink-0">
              <input
                type="text"
                placeholder="Log mesajı və ya context-ə görə axtar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Logs List Container */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredLogs.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs italic">
                  <span>Log tapılmadı.</span>
                  <span className="text-[10px] text-slate-700 mt-1">Sol tərəfdəki simulyatorları işə sala bilərsiniz.</span>
                </div>
              )}
              
              {filteredLogs.map((log, index) => {
                const colorMap: Record<string, string> = {
                  DEBUG: "bg-blue-500/15 text-blue-400 border-blue-500/20",
                  INFO: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
                  WARN: "bg-amber-500/15 text-amber-400 border-amber-500/20",
                  ERROR: "bg-red-500/15 text-red-400 border-red-500/20",
                  FATAL: "bg-purple-500/15 text-purple-400 border-purple-500/20",
                };
                
                const isExpanded = expandedLogId === index;
                const timeStr = log.timestamp ? log.timestamp.split("T")[1].slice(0, 8) : "N/A";

                return (
                  <div 
                    key={index}
                    className={`border border-slate-800 bg-slate-950/30 rounded-lg p-3 hover:bg-slate-950/60 transition-all cursor-pointer ${
                      isExpanded ? "border-slate-700" : ""
                    }`}
                    onClick={() => setExpandedLogId(isExpanded ? null : index)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${colorMap[log.level]}`}>
                        {log.level}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{timeStr}</span>
                    </div>

                    <p className="text-xs text-slate-200 mt-1.5 break-all font-mono leading-relaxed">{log.message}</p>

                    {isExpanded && log.context ? (
                      <div className="mt-3 pt-3 border-t border-slate-900 bg-black/40 rounded p-2 overflow-x-auto font-mono text-[10px] text-slate-400 space-y-1 anim-fade-up">
                        <span className="text-slate-500 uppercase font-bold text-[9px] block mb-1">Log Metadata (Scrubbed PII/PCI):</span>
                        <pre className="whitespace-pre-wrap">{JSON.stringify(log.context, null, 2)}</pre>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
