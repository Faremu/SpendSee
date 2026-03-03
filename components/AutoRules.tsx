
import React from 'react';
import { DCARule } from '../types';

interface AutoRulesProps {
  rules: DCARule[];
  onToggleRule: (id: string) => void;
  onDeleteRule: (id: string) => void;
  onAddRule: () => void;
  salary: number;
}

const AutoRules: React.FC<AutoRulesProps> = ({ rules, onToggleRule, onDeleteRule, onAddRule, salary }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Auto-Pilot</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">DCA & Savings Rules</p>
        </div>
        <button 
          onClick={onAddRule}
          className="p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl transition-all shadow-lg shadow-slate-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
        </button>
      </div>
      
      <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
        {rules.map(rule => {
          const amount = rule.type === 'percent' ? (salary * rule.value) / 100 : rule.value;
          return (
            <div 
              key={rule.id}
              className={`p-4 sm:p-5 rounded-[1.5rem] border transition-all flex items-center justify-between gap-3 ${
                rule.active 
                  ? 'bg-indigo-50/30 border-indigo-100 shadow-sm' 
                  : 'bg-slate-50 border-slate-100 opacity-60'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-black text-slate-900 truncate">{rule.name}</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2 mt-1">
                  <span className="truncate">{rule.type === 'percent' ? `${rule.value}% Sal.` : `฿${rule.value.toLocaleString()} Fixed`}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-200 shrink-0"></span>
                  <span className="text-indigo-600 shrink-0">฿{amount.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button 
                  onClick={() => onDeleteRule(rule.id)}
                  className="p-2 sm:p-3 text-slate-300 hover:text-rose-500 transition-colors"
                  title="Delete Rule"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
                <button 
                  onClick={() => onToggleRule(rule.id)}
                  className={`w-12 h-7 rounded-full transition-all relative shrink-0 ${rule.active ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${rule.active ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-8 pt-6 border-t border-slate-100">
        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total Auto-Allocation</span>
            <span className="text-3xl font-black text-slate-900 tracking-tighter">
              ฿{rules.filter(r => r.active).reduce((sum, r) => sum + (r.type === 'percent' ? (salary * r.value) / 100 : r.value), 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoRules;
