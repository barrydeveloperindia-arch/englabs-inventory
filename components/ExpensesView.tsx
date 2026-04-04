
import React, { useState, useMemo } from 'react';
import { Expense, ViewType, AuditEntry } from '../types';

interface ExpensesViewProps {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  logAction: (action: string, module: ViewType, details: string, severity?: AuditEntry['severity']) => void;
}

const ExpensesView: React.FC<ExpensesViewProps> = ({ expenses, setExpenses, logAction }) => {
  const [formData, setFormData] = useState<Partial<Expense>>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    category: 'Utilities'
  });

  const [selectedFilterCategory, setSelectedFilterCategory] = useState('All');

  const uniqueCategories = useMemo(() => {
    const cats = new Set(expenses.map(e => e.category));
    return ['All', ...Array.from(cats)];
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    let list = expenses;
    if (selectedFilterCategory !== 'All') {
      list = list.filter(e => e.category === selectedFilterCategory);
    }
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, selectedFilterCategory]);

  const handleAdd = () => {
    if (!formData.description || !formData.amount) return;
    const newExp: Expense = {
      id: crypto.randomUUID(),
      date: formData.date || '',
      description: formData.description || '',
      amount: formData.amount || 0,
      category: formData.category || 'Other'
    };
    setExpenses(prev => [...prev, newExp]);
    logAction('Expense Logged', 'expenses', `Authorized £${newExp.amount} payment for ${newExp.description} (${newExp.category}).`, 'Warning');
    setFormData({ ...formData, description: '', amount: 0 });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
      <div className="lg:col-span-1">
        <div className="bg-surface-elevated p-8 rounded-2xl shadow-sm border border-surface-highlight sticky top-10">
          <h4 className="text-sm font-black text-ink-base uppercase tracking-widest mb-8 flex items-center gap-2">
            <span className="w-2 h-6 bg-primary-600"></span> Outgoing Remittance
          </h4>
          <div className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Remittance Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-surface-elevated border border-surface-highlight rounded-xl px-4 py-3.5 text-sm font-bold focus:border-primary-600 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payee / Description</label>
              <input
                type="text"
                placeholder="e.g. British Gas, Council Tax"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-surface-elevated border border-surface-highlight rounded-xl px-4 py-3.5 text-sm font-bold focus:border-primary-600 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Value (£)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-surface-elevated border border-surface-highlight rounded-xl px-4 py-3.5 text-lg font-black font-mono focus:border-primary-600 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ops Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-surface-elevated border border-surface-highlight rounded-xl px-4 py-4 text-[10px] font-black uppercase tracking-widest focus:border-primary-600 outline-none"
                >
                  <option>Utilities</option>
                  <option>Business Rates</option>
                  <option>Rent</option>
                  <option>Maintenance</option>
                  <option>Licensing</option>
                  <option>HMRC Paye</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <button
              onClick={handleAdd}
              className="w-full bg-primary-600 text-white py-5 rounded-xl font-black text-xs uppercase tracking-[0.4em] shadow-xl shadow-primary-100 hover:scale-105 active:scale-95 transition-all mt-4"
            >
              Authorize Remittance
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="bg-surface-elevated rounded-2xl shadow-sm border border-surface-highlight overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-surface-elevated/50 flex flex-wrap justify-between items-center gap-4">
            <h4 className="text-sm font-black text-ink-base uppercase tracking-widest">Expense Audit Trail</h4>

            <div className="flex items-center gap-6">
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Filter Category</label>
                <select
                  value={selectedFilterCategory}
                  onChange={e => setSelectedFilterCategory(e.target.value)}
                  className="bg-surface-elevated border border-surface-highlight rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:border-primary-600 appearance-none cursor-pointer h-[34px] min-w-[140px]"
                >
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Outgoings</p>
                <p className="text-2xl font-black font-mono text-primary-600">£{filteredExpenses.reduce((acc, e) => acc + e.amount, 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap hidden md:table">
              <thead className="bg-surface-elevated text-slate-400 uppercase text-[9px] font-black tracking-[0.3em] border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5">Value Date</th>
                  <th className="px-8 py-5">Payee / Category</th>
                  <th className="px-8 py-5">Amount</th>
                  <th className="px-8 py-5 text-right">Ops</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center text-slate-300 font-bold uppercase tracking-widest">Registry Clean: No Expenses Logged</td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-surface-elevated/50 transition-all group">
                      <td className="px-8 py-6">
                        <span className="text-sm font-black text-ink-base">{new Date(exp.date).toLocaleDateString('en-GB')}</span>
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-black text-ink-base text-sm">{exp.description}</p>
                        <p className="text-[10px] font-black uppercase text-primary-600 tracking-widest mt-1">{exp.category}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xl font-black font-mono text-primary-600">£{exp.amount.toFixed(2)}</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button
                          onClick={() => {
                            if (confirm('Authorize removal of expense entry?')) {
                              setExpenses(prev => prev.filter(e => e.id !== exp.id));
                              logAction('Expense Deletion', 'expenses', `Permanently removed expense record: ${exp.description} (£${exp.amount}).`, 'Critical');
                            }
                          }}
                          className="p-3 text-slate-200 hover:text-rose-500 transition-all hidden group-hover:block"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Mobile Expense Cards */}
            <div className="md:hidden p-4 space-y-4 bg-surface-elevated">
              {filteredExpenses.length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-xs">No expenses found</div>
              ) : (
                filteredExpenses.map(exp => (
                  <div key={exp.id} className="bg-surface-elevated p-5 rounded-2xl border border-surface-highlight shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-black text-ink-base uppercase text-sm">{exp.description}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-1">{new Date(exp.date).toLocaleDateString('en-GB')}</p>
                      </div>
                      <span className="text-xl font-black font-mono text-primary-600">£{exp.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                      <span className="px-2 py-1 bg-primary-50 text-primary-600 text-[9px] font-black uppercase rounded">{exp.category}</span>
                      <button
                        onClick={() => {
                          if (confirm('Authorize removal of expense entry?')) {
                            setExpenses(prev => prev.filter(e => e.id !== exp.id));
                            logAction('Expense Deletion', 'expenses', `Permanently removed expense record: ${exp.description} (£${exp.amount}).`, 'Critical');
                          }
                        }}
                        className="text-slate-300 hover:text-rose-500 font-black text-lg p-2"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpensesView;
