import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Transaction, TransactionType, Category, DCARule, FinancialStats } from './types';
import { CATEGORIES, INITIAL_RULES } from './constants';
import TreeMap from './components/TreeMap';
import AutoRules from './components/AutoRules';

import { ScreenOrientation } from '@capacitor/screen-orientation';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('flux_transactions');
    return saved ? JSON.parse(saved) : [];
  });
  const [rules, setRules] = useState<DCARule[]>(() => {
    const saved = localStorage.getItem('flux_rules');
    return saved ? JSON.parse(saved) : [...INITIAL_RULES];
  });
  const [salary, setSalary] = useState<number>(() => {
    const saved = localStorage.getItem('flux_salary');
    return saved ? Number(saved) : 50000;
  });
  const [salaryInput, setSalaryInput] = useState<string>(salary.toString());

  useEffect(() => {
    localStorage.setItem('flux_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('flux_rules', JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    localStorage.setItem('flux_salary', salary.toString());
  }, [salary]);

  // Orientation Lock Logic
  useEffect(() => {
    const lockOrientation = async () => {
      try {
        // Try Capacitor plugin first
        await ScreenOrientation.lock({ orientation: 'portrait' }).catch(() => {});
        
        // Fallback to Web Screen Orientation API
        // @ts-ignore
        if (screen.orientation && screen.orientation.lock) {
          // @ts-ignore
          await screen.orientation.lock('portrait').catch(() => {});
        }
      } catch (err) {}
    };

    lockOrientation();
    
    // Re-lock when app becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        lockOrientation();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleSalaryChange = (val: string) => {
    setSalaryInput(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setSalary(num);
    } else {
      setSalary(0);
    }
  };
  const [isAdding, setIsAdding] = useState<TransactionType | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportJson, setExportJson] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<{name: string, value: number, color: string, icon: string} | null>(null);

  // Form states
  const [formAmount, setFormAmount] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('');
  const [formLogo, setFormLogo] = useState<string>('');
  const [formColor, setFormColor] = useState<string>('#6366f1');

  // Rule form states
  const [ruleName, setRuleName] = useState('');
  const [ruleType, setRuleType] = useState<'fixed' | 'percent'>('percent');
  const [ruleValue, setRuleValue] = useState('');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('th-TH', { 
      style: 'currency', 
      currency: 'THB', 
      minimumFractionDigits: 0 
    }).format(val);
  };

  const getIconUrl = (icon: string) => {
    if (!icon) return '💸';
    const isPotentialUrl = icon.startsWith('http') || (icon.includes('.') && !icon.includes(' '));
    
    if (isPotentialUrl) {
      if (/\.(jpg|jpeg|png|gif|svg|webp)$/i.test(icon)) {
         return icon;
      }
      try {
        const domain = icon.replace('https://', '').replace('http://', '').split('/')[0];
        return `https://vexly.app/api/proxy/logo?domain=${domain}&size=128&retina=true&format=png`;
      } catch (e) {
        return icon;
      }
    }
    return icon;
  };

  const stats: FinancialStats = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0) + salary;

    const totalExpenses = transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalInvested = rules
      .filter(r => r.active)
      .reduce((sum, r) => sum + (r.type === 'percent' ? (salary * r.value) / 100 : r.value), 0);

    return {
      totalIncome,
      totalExpenses,
      totalInvested,
      balance: totalIncome - totalExpenses - totalInvested
    };
  }, [transactions, salary, rules]);

  const handleConfirmAdd = () => {
    const amount = parseFloat(formAmount);
    if (!amount || !formCategory) return;

    if (editingId) {
      setTransactions(prev => prev.map(t => t.id === editingId ? {
        ...t,
        amount,
        category: formCategory,
        categoryIcon: formLogo || '💸',
        color: formColor
      } : t));
    } else {
      const newTransaction: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        amount,
        type: isAdding as TransactionType,
        category: formCategory,
        categoryIcon: formLogo || '💸',
        color: formColor,
        note: '',
        date: Date.now()
      };
      setTransactions(prev => [newTransaction, ...prev]);
    }

    closeModal();
  };

  const handleCategoryChange = (val: string) => {
    setFormCategory(val);
    const matched = CATEGORIES.find(c => c.name.toLowerCase() === val.toLowerCase());
    if (matched) {
      setFormColor(matched.color);
      if (!formLogo) setFormLogo(matched.icon);
    }
  };

  const closeModal = () => {
    setIsAdding(null);
    setEditingId(null);
    setFormAmount('');
    setFormCategory('');
    setFormLogo('');
    setFormColor('#6366f1');
  };

  const handleEdit = (t: Transaction) => {
    setEditingId(t.id);
    setFormAmount(t.amount.toString());
    setFormCategory(t.category);
    setFormLogo(t.categoryIcon);
    setFormColor(t.color || '#6366f1');
    setIsAdding(t.type);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const exportData = async () => {
    const data = {
      transactions,
      rules,
      salary,
      version: '1.0',
      exportedAt: new Date().toISOString()
    };
    const jsonString = JSON.stringify(data, null, 2);
    setExportJson(jsonString);
    setIsExportModalOpen(true);
  };

  const handleDownloadFile = () => {
    const filename = `mymoney-backup-${new Date().toISOString().split('T')[0]}.json`;
    const blob = new Blob([exportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // On some mobile browsers, standard link click fails. 
    // Trying a more direct approach for mobile.
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.location.href = `data:application/json;base64,${btoa(exportJson)}`;
    } else {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleShareData = async () => {
    const filename = `mymoney-backup-${new Date().toISOString().split('T')[0]}.json`;
    if (navigator.share) {
      try {
        const file = new File([exportJson], filename, { type: 'application/json' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'SpendSee Backup',
            text: 'Financial data backup from SpendSee'
          });
        } else {
          await navigator.share({
            title: 'SpendSee Backup Data',
            text: exportJson
          });
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          alert('Sharing failed. Please try copying the data instead.');
        }
      }
    } else {
      alert('Sharing is not supported in this browser.');
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(exportJson);
      alert('Backup data copied to clipboard!');
    } catch (err) {
      alert('Failed to copy. Please select the text and copy manually.');
    }
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.transactions) setTransactions(data.transactions);
        if (data.rules) setRules(data.rules);
        if (data.salary) {
          setSalary(data.salary);
          setSalaryInput(data.salary.toString());
        }
        alert('Data imported successfully!');
      } catch (err) {
        alert('Failed to import data. Please check the file format.');
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const handleConfirmAddRule = () => {
    const val = parseFloat(ruleValue);
    if (!ruleName || isNaN(val)) return;

    const newRule: DCARule = {
      id: Math.random().toString(36).substr(2, 9),
      name: ruleName,
      type: ruleType,
      value: val,
      target: 'Savings',
      active: true
    };

    setRules(prev => [...prev, newRule]);
    setIsAddingRule(false);
    setRuleName('');
    setRuleType('percent');
    setRuleValue('');
  };

  return (
    <div className="min-h-screen p-4 md:p-10 max-w-[1600px] mx-auto flex flex-col gap-6 md:gap-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 w-full md:w-auto">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900">SpendSee</h1>
            <p className="text-slate-500 text-sm md:text-base font-medium mt-1">Intelligent wealth orchestration</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={exportData}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              Export
            </button>
            <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
              Import
              <input type="file" accept=".json" onChange={importData} className="hidden" />
            </label>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-white px-5 py-3 md:px-7 md:py-4 rounded-2xl md:rounded-[2rem] border border-slate-200 shadow-sm w-full md:w-auto">
          <div className="flex flex-col w-full">
            <span className="text-[9px] md:text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] leading-none mb-2">Monthly Salary</span>
            <div className="flex items-center gap-1">
              <span className="text-slate-300 font-black text-xl md:text-2xl">฿</span>
              <input 
                type="text"
                inputMode="decimal"
                value={salaryInput} 
                onChange={(e) => handleSalaryChange(e.target.value)}
                onBlur={() => setSalaryInput(salary.toString())}
                placeholder="0"
                className="bg-transparent border-none text-slate-900 font-black text-xl md:text-3xl w-full focus:outline-none focus:ring-0 placeholder:text-slate-200"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
        {/* Row 1, Col 1-4 */}
        <div className="md:col-span-4 bento-card p-6 md:p-10 flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">Net Surplus</span>
            <div className="p-2 bg-indigo-50 rounded-xl">
              <svg className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
            </div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              {formatCurrency(stats.balance)}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Liquid Funds</div>
          </div>
        </div>

        {/* Row 1-2, Col 5-12 */}
        <div className="md:col-span-8 md:row-span-2 bento-card p-6 md:p-10 flex flex-col min-h-[400px] md:min-h-0">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Footprint</h3>
              <p className="text-xs text-slate-400 font-medium">Categorical flow analysis</p>
            </div>
            <div className="text-right">
              <span className="text-base font-black text-rose-500">{formatCurrency(stats.totalExpenses)}</span>
              <div className="text-[9px] uppercase tracking-[0.2em] text-slate-300 font-black">Burn rate</div>
            </div>
          </div>
          <div className="flex-1 w-full relative">
             <MeasureWrapper>
               {(w, h) => (
                 <TreeMap 
                   transactions={transactions} 
                   width={w} 
                   height={h} 
                   onNodeClick={(name, value, color, icon) => setSelectedCategory({name, value, color, icon})}
                 />
               )}
             </MeasureWrapper>
          </div>
        </div>

        {/* Row 2-3, Col 1-4 */}
        <div className="md:col-span-4 md:row-span-2 bento-card p-6 md:p-10 flex flex-col min-h-[350px]">
          <AutoRules 
            rules={rules} 
            onToggleRule={toggleRule} 
            onDeleteRule={deleteRule}
            onAddRule={() => setIsAddingRule(true)} 
            salary={salary} 
          />
        </div>

        {/* Row 3, Col 5-12 (Filling space left by removed AI card) */}
        <div className="md:col-span-8 bento-card p-6 md:p-10 flex flex-col min-h-[200px]">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Capture Transaction</h3>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 h-full flex-1">
            <button 
              onClick={() => setIsAdding(TransactionType.INCOME)}
              className="flex flex-col items-center justify-center gap-3 rounded-[2rem] bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-all active:scale-95 group"
            >
              <span className="text-3xl md:text-5xl group-hover:scale-110 transition-transform">💰</span>
              <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Inflow</span>
            </button>
            <button 
              onClick={() => setIsAdding(TransactionType.EXPENSE)}
              className="flex flex-col items-center justify-center gap-3 rounded-[2rem] bg-rose-50 border border-rose-100 hover:bg-rose-100 transition-all active:scale-95 group"
            >
              <span className="text-3xl md:text-5xl group-hover:scale-110 transition-transform">💸</span>
              <span className="text-xs font-black text-rose-600 uppercase tracking-widest">Outflow</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bento-card p-6 md:p-10 mt-4">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Ledger</h3>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{transactions.length} Entries</span>
        </div>
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <div className="text-center py-16 text-slate-300 font-black uppercase tracking-[0.3em] text-[11px] italic">No activity detected</div>
          ) : (
            transactions.slice(0, 30).map(t => {
              const iconUrl = getIconUrl(t.categoryIcon);
              const isUrl = iconUrl.startsWith('http');
              return (
                <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-3xl bg-slate-50/50 border border-slate-100 hover:border-slate-300 hover:bg-white transition-all group/item shadow-sm gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-2xl flex items-center justify-center text-xl sm:text-3xl shadow-sm border border-white bg-white overflow-hidden relative">
                      {isUrl ? (
                        <img src={iconUrl} alt={t.category} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        t.categoryIcon
                      )}
                      {t.color && (
                        <div 
                          className="absolute bottom-0 left-0 right-0 h-1" 
                          style={{ backgroundColor: t.color }}
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-black text-slate-900 text-base sm:text-lg truncate leading-tight">{t.category}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{new Date(t.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className={`text-lg sm:text-2xl font-black text-right ${
                      t.type === TransactionType.INCOME ? 'text-emerald-500' : 
                      t.type === TransactionType.EXPENSE ? 'text-rose-500' : 'text-slate-900'
                    }`}>
                      {t.type === TransactionType.INCOME ? '+' : t.type === TransactionType.EXPENSE ? '-' : ''}{formatCurrency(t.amount)}
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleEdit(t)}
                        className="p-3 bg-white border border-slate-200 hover:border-indigo-400 rounded-xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm active:scale-90"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                      </button>
                      <button 
                        onClick={(e) => handleDelete(t.id, e)}
                        className="p-3 bg-white border border-slate-200 hover:border-rose-400 rounded-xl text-slate-400 hover:text-rose-600 transition-all shadow-sm active:scale-90"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {(isAdding || editingId) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <div className="bg-white border border-slate-200 p-8 md:p-12 rounded-[2.5rem] w-full max-w-xl shadow-2xl relative my-auto animate-in fade-in zoom-in duration-300">
            <h2 className="text-3xl md:text-5xl font-black mb-8 md:mb-12 text-slate-900 tracking-tight">
              {editingId ? 'Refine' : 'Capture'} {isAdding === TransactionType.INCOME ? 'Inflow' : 'Outflow'}
            </h2>
            
            <div className="space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar pr-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Magnitude (THB)</label>
                <div className="relative">
                   <span className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 text-3xl md:text-5xl font-black ml-5">฿</span>
                   <input 
                    type="number" 
                    autoFocus
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] p-6 md:p-10 pl-14 md:pl-20 text-4xl md:text-7xl font-black text-slate-900 focus:outline-none focus:border-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Classification</label>
                <input 
                  type="text" 
                  value={formCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  placeholder="e.g. Starbucks, Salary, Rent"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] p-5 md:p-8 text-lg md:text-2xl font-black text-slate-900 focus:outline-none focus:border-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Visual Identifier</label>
                <input 
                  type="text" 
                  value={formLogo}
                  onChange={(e) => setFormLogo(e.target.value)}
                  placeholder="URL or Emoji (🍔, 🏠)"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] p-5 md:p-8 text-lg md:text-2xl font-black text-slate-900 focus:outline-none focus:border-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Color Accent</label>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] p-5 md:p-8">
                    <input 
                      type="color" 
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      className="w-12 h-12 rounded-xl border-none cursor-pointer bg-transparent"
                    />
                    <input 
                      type="text" 
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      className="flex-1 bg-transparent border-none text-lg md:text-2xl font-black text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-wrap gap-3 px-2">
                    {['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#D1BAFF', '#FFB3E6', '#B2F2BB', '#A5F3FC', '#FBCFE8', '#6366f1', '#0f172a'].map(c => (
                      <button
                        key={c}
                        onClick={() => setFormColor(c)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${formColor === c ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-8 flex flex-col gap-4">
                <button 
                  onClick={handleConfirmAdd}
                  className="w-full py-5 md:py-8 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-2xl active:scale-95"
                >
                  {editingId ? 'Execute Update' : 'Log Transaction'}
                </button>
                <button 
                  onClick={closeModal}
                  className="w-full py-4 text-slate-400 font-black uppercase tracking-[0.2em] hover:text-slate-900 transition-colors text-xs"
                >
                  Discard Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAddingRule && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <div className="bg-white border border-slate-200 p-8 md:p-12 rounded-[2.5rem] w-full max-w-xl shadow-2xl relative my-auto animate-in fade-in zoom-in duration-300">
            <h2 className="text-3xl md:text-5xl font-black mb-8 md:mb-12 text-slate-900 tracking-tight">
              New Rule
            </h2>
            
            <div className="space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar pr-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Rule Name</label>
                <input 
                  type="text" 
                  autoFocus
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="e.g. Emergency Fund, Crypto DCA"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] p-5 md:p-8 text-lg md:text-2xl font-black text-slate-900 focus:outline-none focus:border-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Allocation Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setRuleType('percent')}
                    className={`py-4 rounded-2xl font-black uppercase tracking-widest text-xs border-2 transition-all ${ruleType === 'percent' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-100 text-slate-400'}`}
                  >
                    Percentage
                  </button>
                  <button 
                    onClick={() => setRuleType('fixed')}
                    className={`py-4 rounded-2xl font-black uppercase tracking-widest text-xs border-2 transition-all ${ruleType === 'fixed' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-100 text-slate-400'}`}
                  >
                    Fixed Amount
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">
                  {ruleType === 'percent' ? 'Percentage of Salary' : 'Monthly Amount (THB)'}
                </label>
                <div className="relative">
                   <span className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 text-2xl md:text-4xl font-black ml-5">
                     {ruleType === 'percent' ? '%' : '฿'}
                   </span>
                   <input 
                    type="number" 
                    value={ruleValue}
                    onChange={(e) => setRuleValue(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] p-6 md:p-10 pl-14 md:pl-20 text-3xl md:text-5xl font-black text-slate-900 focus:outline-none focus:border-indigo-500/20"
                  />
                </div>
              </div>

              <div className="pt-8 flex flex-col gap-4">
                <button 
                  onClick={handleConfirmAddRule}
                  className="w-full py-5 md:py-8 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-2xl active:scale-95"
                >
                  Create Rule
                </button>
                <button 
                  onClick={() => setIsAddingRule(false)}
                  className="w-full py-4 text-slate-400 font-black uppercase tracking-[0.2em] hover:text-slate-900 transition-colors text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-8 md:p-10 flex flex-col gap-8 overflow-y-auto">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Data Backup</h2>
                  <p className="text-sm text-slate-400 font-medium mt-1">Choose how to save your data</p>
                </div>
                <button 
                  onClick={() => setIsExportModalOpen(false)}
                  className="p-3 hover:bg-slate-50 rounded-2xl transition-colors"
                >
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={handleDownloadFile}
                  className="flex items-center gap-4 p-6 bg-indigo-50 hover:bg-indigo-100 rounded-3xl transition-all group"
                >
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg group-active:scale-90 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  </div>
                  <div className="text-left">
                    <div className="font-black text-slate-900">Download JSON</div>
                    <div className="text-xs text-slate-500">Save as a file to your device</div>
                  </div>
                </button>

                <button 
                  onClick={handleCopyToClipboard}
                  className="flex items-center gap-4 p-6 bg-emerald-50 hover:bg-emerald-100 rounded-3xl transition-all group"
                >
                  <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg group-active:scale-90 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                  </div>
                  <div className="text-left">
                    <div className="font-black text-slate-900">Copy to Clipboard</div>
                    <div className="text-xs text-slate-500">Copy raw data to paste elsewhere</div>
                  </div>
                </button>

                {navigator.share && (
                  <button 
                    onClick={handleShareData}
                    className="flex items-center gap-4 p-6 bg-amber-50 hover:bg-amber-100 rounded-3xl transition-all group"
                  >
                    <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg group-active:scale-90 transition-transform">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                    </div>
                    <div className="text-left">
                      <div className="font-black text-slate-900">Share Backup</div>
                      <div className="text-xs text-slate-500">Send via WhatsApp, Drive, etc.</div>
                    </div>
                  </button>
                )}
              </div>

              <div className="mt-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Raw Data (Preview)</label>
                <textarea 
                  readOnly
                  value={exportJson}
                  className="w-full h-32 bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-[10px] font-mono text-slate-400 focus:outline-none resize-none"
                />
              </div>

              <button 
                onClick={() => setIsExportModalOpen(false)}
                className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Detail Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-8 md:p-10 flex flex-col items-center text-center gap-6">
              <div 
                className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl shadow-xl"
                style={{ backgroundColor: selectedCategory.color }}
              >
                {getIconUrl(selectedCategory.icon).startsWith('http') ? (
                  <img 
                    src={getIconUrl(selectedCategory.icon)} 
                    className="w-16 h-16 object-contain rounded-xl" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  selectedCategory.icon
                )}
              </div>
              
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedCategory.name}</h2>
                <div className="text-4xl font-black text-indigo-600 mt-2">
                  {formatCurrency(selectedCategory.value)}
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">
                  Total Category Outflow
                </div>
              </div>

              <div className="w-full bg-slate-50 rounded-3xl p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Share of Expenses</span>
                  <span className="text-lg font-black text-slate-900">
                    {((selectedCategory.value / stats.totalExpenses) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-1000"
                    style={{ 
                      width: `${(selectedCategory.value / stats.totalExpenses) * 100}%`,
                      backgroundColor: selectedCategory.color 
                    }}
                  />
                </div>
              </div>

              <button 
                onClick={() => setSelectedCategory(null)}
                className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all active:scale-95"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MeasureWrapper: React.FC<{ children: (width: number, height: number) => React.ReactNode }> = ({ children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setSize({ width, height });
      }
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} className="w-full h-full relative overflow-hidden">{children(size.width, size.height)}</div>;
};

export default App;
