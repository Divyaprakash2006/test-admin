import { useEffect, useState } from 'react';
import {
  HiPlusSmall, HiTrash, HiChevronUp, HiChevronDown, HiOutlineDocumentCheck, HiBookOpen, HiArrowsUpDown, HiXMark, HiCheck, HiArrowUpTray
} from 'react-icons/hi2';
import api from '../api';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const TYPES = [
  { value: 'mcq-single', label: 'MCQ (Single)' },
  { value: 'mcq-multi', label: 'MCQ (Multi)' },
  { value: 'true-false', label: 'True / False' },
  { value: 'short-answer', label: 'Short Answer' },
  { value: 'fill-blank', label: 'Fill in the Blank' },
  { value: 'coding', label: 'Coding Problem' },
];

const emptyQ = () => ({
  type: 'mcq-single', text: '', options: ['', '', '', ''],
  correctAnswer: '', marks: 1, tags: [], explanation: '',
  shuffleOptions: false,
  testCases: [],
  allowedLanguages: ['javascript', 'python', 'java', 'cpp'],
  _temp: Date.now()
});

export default function TestBuilder() {
  const navigate  = useNavigate();
  const { id }    = useParams();
  const { theme } = useTheme();
  const isDark    = theme === 'dark';
  const isEdit    = Boolean(id);

  const [form, setForm]         = useState({ title: '', subject: '', description: '', duration: 30, passmark: 0, scheduledDate: '', expiryDate: '', unlimitedAttempts: false, maxAttempts: 1, shuffleQuestions: false });
  const [questions, setQuestions] = useState([emptyQ()]);
  const [activeQ, setActiveQ]   = useState(0);
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState(false);
  const [testId, setTestId]     = useState(id || null);
  const [saved, setSaved]       = useState(isEdit);
  const [error, setError]       = useState('');
  const [showAikenModal, setShowAikenModal] = useState(false);
  const [aikenText, setAikenText]           = useState('');

  // Theme tokens
  const textSub     = isDark ? 'text-gray-400' : 'text-gray-500';
  const listItem    = isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100';
  const listActive  = isDark ? 'bg-primary-600/20 border border-primary-600/30' : 'bg-primary-50 border border-primary-200';
  const gripColor   = isDark ? 'text-gray-600' : 'text-gray-400';
  const removeBtn   = isDark ? 'hover:text-red-400 text-gray-600' : 'hover:text-red-500 text-gray-400';
  const tfBtn       = (active) => active
    ? 'bg-primary-600 border-primary-500 text-white'
    : isDark ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400';
  const checkBtn    = (active) => active
    ? 'bg-primary-600 border-primary-500 text-white'
    : isDark ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-white border-gray-300 text-gray-400';
  const listScroll  = isDark ? 'divide-gray-800/50' : 'divide-gray-200';

  useEffect(() => {
    if (isEdit) {
      api.get(`/tests/${id}`).then(({ data }) => {
        const t = data.test;
        // Format: YYYY-MM-DDTHH:MM for datetime-local
        let schedStr = '';
        if (t.scheduledDate) {
          const d = new Date(t.scheduledDate);
          schedStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        }
        let expiryStr = '';
        if (t.expiryDate) {
          const d = new Date(t.expiryDate);
          expiryStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        }
        setForm({ 
          title: t.title, 
          subject: t.subject || '', 
          description: t.description || '', 
          duration: t.duration, 
          passmark: t.passmark || 0,
          scheduledDate: schedStr,
          expiryDate: expiryStr,
          unlimitedAttempts: t.unlimitedAttempts || false,
          maxAttempts: t.maxAttempts || 1,
          shuffleQuestions: t.shuffleQuestions || false
        });
        if (t.questions?.length) setQuestions(t.questions);
      }).catch(() => setError('Failed to load test'));
    }
  }, [id, isEdit]);

  const saveTest = async () => {
    setSaving(true); setError(''); setSuccess(false);
    try {
      // Ensure scheduledDate is sent as a proper ISO string (standardizes timezone)
      const payload = { 
        ...form, 
        scheduledDate: form.scheduledDate ? new Date(form.scheduledDate).toISOString() : null,
        expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : null
      };

      if (!testId) {
        const { data } = await api.post('/tests', payload);
        setTestId(data.test._id);
        setSaved(true);
        setSuccess(true);
      } else {
        await api.put(`/tests/${testId}`, payload);
        setSuccess(true);
      }
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) { setError(e.response?.data?.message || 'Save failed'); }
    setSaving(false);
  };

  const saveQuestion = async (q, idx) => {
    if (!testId) { setError('Save the test details first'); return; }
    setSaving(true); setError('');
    try {
      if (q._id) {
        const { data } = await api.put(`/tests/${testId}/questions/${q._id}`, q);
        const newQs = [...questions]; newQs[idx] = data.question; setQuestions(newQs);
      } else {
        const { data } = await api.post(`/tests/${testId}/questions`, q);
        const newQs = [...questions]; newQs[idx] = data.question; setQuestions(newQs);
      }
    } catch (e) { setError(e.response?.data?.message || 'Save failed'); }
    setSaving(false);
  };

  const saveAllQuestions = async () => {
    if (!testId) { setError('Save the test details first'); return; }
    const unsaved = questions.filter(q => !q._id);
    if (!unsaved.length) { setError('No new questions to save'); return; }
    
    setSaving(true); setError('');
    try {
      const { data } = await api.post(`/tests/${testId}/questions/bulk`, { questions: unsaved });
      // Map returned IDs back to questions
      const savedQs = data.questions;
      const newQs = questions.map(q => {
        if (q._id) return q;
        const matching = savedQs.find(sq => sq.text === q.text); // simple match by text
        return matching || q;
      });
      setQuestions(newQs);
    } catch (e) { setError(e.response?.data?.message || 'Bulk save failed'); }
    setSaving(false);
  };

  const removeQuestion = async (idx) => {
    const q = questions[idx];
    if (q._id && testId) await api.delete(`/tests/${testId}/questions/${q._id}`);
    setQuestions(prev => prev.filter((_, i) => i !== idx));
    setActiveQ(Math.max(0, idx - 1));
  };

  const moveQ = (idx, dir) => {
    const qs = [...questions];
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= qs.length) return;
    [qs[idx], qs[swapIdx]] = [qs[swapIdx], qs[idx]];
    setQuestions(qs); setActiveQ(swapIdx);
  };

  const updateQ = (idx, updates) => {
    const qs = [...questions];
    qs[idx] = { ...qs[idx], ...updates };
    setQuestions(qs);
  };

  const handleAikenImport = () => {
    if (!aikenText.trim()) return;
    
    const blocks = aikenText.trim().split(/\n\s*\n/);
    const newQuestions = blocks.map(block => {
      const lines = block.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length < 3) return null;

      const answerLineIndex = lines.findIndex(l => l.toUpperCase().startsWith('ANSWER:'));
      if (answerLineIndex === -1) return null;

      const answerChar = lines[answerLineIndex].split(':')[1].trim().toUpperCase();
      
      // Question text is everything before the first option
      const firstOptIndex = lines.findIndex(l => /^[A-Z][\.)]/.test(l));
      if (firstOptIndex === -1) return null;
      
      const questionText = lines.slice(0, firstOptIndex).join(' ').replace(/^\s*\d+[\.\)]\s*/, '');
      const optionLines = lines.slice(firstOptIndex, answerLineIndex).filter(l => /^[A-Z][\.)]/.test(l));
      
      const options = optionLines.map(l => l.replace(/^[A-Z][\.)]\s*/, ''));
      const answerLetterToIndex = answerChar.charCodeAt(0) - 65;
      const correctAnswer = options[answerLetterToIndex] || '';

      return {
        ...emptyQ(),
        type: 'mcq-single',
        text: questionText,
        options: options.length >= 2 ? options : ['', '', '', ''],
        correctAnswer: correctAnswer,
        _temp: Date.now() + Math.random()
      };
    }).filter(q => q !== null);

    if (newQuestions.length > 0) {
      setQuestions(prev => {
        // If the only question is the empty default one and it's untouched, replace it
        if (prev.length === 1 && !prev[0].text && !prev[0]._id) {
          return newQuestions;
        }
        return [...prev, ...newQuestions];
      });
      setShowAikenModal(false);
      setAikenText('');
    } else {
      setError('No valid Aiken questions found. Please check the format.');
    }
  };

  const handleFileLoad = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setAikenText(event.target.result);
    };
    reader.readAsText(file);
  };

  const q = questions[activeQ] || {};

  const renderAnswerInput = () => {
    if (q.type === 'true-false') return (
      <div className="flex gap-3">
        {['True', 'False'].map(v => (
          <button key={v} onClick={() => updateQ(activeQ, { correctAnswer: v })}
            className={`flex-1 py-2 rounded-lg border font-medium text-sm transition-all ${tfBtn(q.correctAnswer === v)}`}>
            {v}
          </button>
        ))}
      </div>
    );
    if (q.type === 'mcq-single') return (
      <div className="space-y-2">
        {(q.options || []).map((opt, oi) => (
          <div key={oi} className="flex gap-2">
            <button onClick={() => updateQ(activeQ, { correctAnswer: opt })}
              className={`p-2 rounded-lg border transition-all shrink-0 ${checkBtn(q.correctAnswer === opt)}`}>
              <HiCheck className="w-4 h-4" />
            </button>
            <input className="input flex-1" placeholder={`Option ${oi + 1}`} value={opt}
              onChange={e => { const o = [...q.options]; o[oi] = e.target.value; updateQ(activeQ, { options: o }); }} />
          </div>
        ))}
      </div>
    );
    if (q.type === 'mcq-multi') return (
      <div className="space-y-2">
        {(q.options || []).map((opt, oi) => {
          const sel = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
          const checked = sel.includes(opt);
          return (
            <div key={oi} className="flex gap-2">
              <button onClick={() => {
                const newSel = checked ? sel.filter(s => s !== opt) : [...sel, opt];
                updateQ(activeQ, { correctAnswer: newSel });
              }} className={`p-2 rounded-lg border transition-all shrink-0 ${checkBtn(checked)}`}>
                <HiCheck className="w-4 h-4" />
              </button>
              <input className="input flex-1" placeholder={`Option ${oi + 1}`} value={opt}
                onChange={e => { const o = [...q.options]; o[oi] = e.target.value; updateQ(activeQ, { options: o }); }} />
            </div>
          );
        })}
      </div>
    );
    if (q.type === 'coding') return (
      <div className="space-y-4">
        <div>
          <label className="label">Allowed Languages</label>
          <div className="flex flex-wrap gap-2">
            {['javascript', 'python', 'java', 'cpp'].map(lang => (
              <button key={lang} onClick={() => {
                const langs = q.allowedLanguages || [];
                const newLangs = langs.includes(lang) ? langs.filter(l => l !== lang) : [...langs, lang];
                updateQ(activeQ, { allowedLanguages: newLangs });
              }} className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${checkBtn((q.allowedLanguages || []).includes(lang))}`}>
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Test Cases</label>
            <button onClick={() => {
              const tc = [...(q.testCases || []), { input: '', output: '', marks: 0, isPublic: false }];
              updateQ(activeQ, { testCases: tc });
            }} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
              <HiPlusSmall className="w-4 h-4" /> Add Test Case
            </button>
          </div>
          <div className="space-y-3">
            {(q.testCases || []).map((tc, tci) => (
              <div key={tci} className={`p-4 rounded-xl border ${isDark ? 'border-gray-800 bg-gray-900/40' : 'border-gray-200 bg-gray-50/50'} space-y-3 relative group/tc`}>
                <button onClick={() => {
                  const tcNew = (q.testCases || []).filter((_, i) => i !== tci);
                  const total = tcNew.reduce((sum, x) => sum + (Number(x.marks) || 0), 0);
                  updateQ(activeQ, { testCases: tcNew, marks: total });
                }} className="absolute top-2 right-2 text-gray-500 hover:text-red-500 opacity-0 group-hover/tc:opacity-100 transition-all">
                  <HiTrash className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`text-[10px] uppercase tracking-wider font-bold mb-1 block ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Input</label>
                    <textarea className="input text-sm h-20 resize-none font-mono" placeholder="e.g. 5 10" value={tc.input} 
                      onChange={e => {
                        const tcNew = [...q.testCases]; tcNew[tci].input = e.target.value;
                        updateQ(activeQ, { testCases: tcNew });
                      }} />
                  </div>
                  <div>
                    <label className={`text-[10px] uppercase tracking-wider font-bold mb-1 block ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Expected Output *</label>
                    <textarea className="input text-sm h-20 resize-none font-mono" placeholder="e.g. 15" value={tc.output}
                      onChange={e => {
                        const tcNew = [...q.testCases]; tcNew[tci].output = e.target.value;
                        updateQ(activeQ, { testCases: tcNew });
                      }} />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer w-fit">
                    <input type="checkbox" className="rounded border-gray-300 bg-white text-primary-600 focus:ring-primary-600 dark:border-gray-700 dark:bg-gray-800"
                      checked={tc.isPublic} onChange={e => {
                        const tcNew = [...q.testCases]; tcNew[tci].isPublic = e.target.checked;
                        updateQ(activeQ, { testCases: tcNew });
                      }} />
                    <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Public Hint</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Marks:</span>
                    <input type="number" className="input text-xs py-1 w-20 text-center" min="0" value={tc.marks || 0}
                      onChange={e => {
                        const tcNew = [...q.testCases]; 
                        tcNew[tci].marks = +e.target.value;
                        const total = tcNew.reduce((sum, x) => sum + (Number(x.marks) || 0), 0);
                        updateQ(activeQ, { testCases: tcNew, marks: total });
                      }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
    return (
      <input className="input" placeholder="Correct answer text" value={q.correctAnswer || ''}
        onChange={e => updateQ(activeQ, { correctAnswer: e.target.value })} />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isEdit ? 'Edit Test' : 'Create Test'}</h1>
          <p className={`${textSub} text-sm mt-1`}>Build your test and add questions</p>
        </div>
        <button onClick={() => navigate('/tests')} className="btn-secondary">← Back to Tests</button>
      </div>

      {error && <div className="bg-red-900/30 border border-red-800 text-red-400 rounded-lg p-3 text-sm">{error}</div>}

      {/* Test Info */}
      <div className="card space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2"><HiBookOpen className="w-5 h-5 text-primary-400" /> Test Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div><label className="label">Title *</label><input className="input" placeholder="e.g. Midterm Exam" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
          <div><label className="label">Subject *</label><input className="input" placeholder="e.g. Mathematics" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} /></div>
          <div><label className="label">Duration (minutes)</label><input type="number" className="input" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: +e.target.value }))} /></div>
          <div><label className="label">Pass Mark (%)</label><input type="number" className="input" value={form.passmark} onChange={e => setForm(p => ({ ...p, passmark: +e.target.value }))} /></div>
          <div><label className="label">Scheduled Date & Time (Start)</label><input type="datetime-local" className="input" value={form.scheduledDate} onChange={e => setForm(p => ({ ...p, scheduledDate: e.target.value }))} /></div>
          <div><label className="label">Expiry Date & Time (End)</label><input type="datetime-local" className="input" value={form.expiryDate} onChange={e => setForm(p => ({ ...p, expiryDate: e.target.value }))} /></div>
          <div><label className="label">Description</label><input className="input" placeholder="Optional description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
          <div className="flex items-center gap-6 py-2 px-1">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-10 h-6 rounded-full p-1 transition-all duration-300 ${form.unlimitedAttempts ? 'bg-primary-600' : 'bg-gray-400 dark:bg-gray-700'}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-all duration-300 ${form.unlimitedAttempts ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
              <input type="checkbox" className="hidden" checked={form.unlimitedAttempts} onChange={e => setForm(p => ({ ...p, unlimitedAttempts: e.target.checked }))} />
              <span className={`text-sm font-bold uppercase tracking-wider ${form.unlimitedAttempts ? 'text-primary-500' : 'text-gray-500'}`}>Unlimited Attempts</span>
            </label>
            {!form.unlimitedAttempts && (
              <div className="flex items-center gap-3">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Max Attempts:</label>
                <input type="number" className="input w-20 py-1 text-center font-bold" min="1" value={form.maxAttempts} 
                  onChange={e => setForm(p => ({ ...p, maxAttempts: Math.max(1, +e.target.value) }))} />
              </div>
            )}
            <label className="flex items-center gap-3 cursor-pointer group ml-2">
              <div className={`w-10 h-6 rounded-full p-1 transition-all duration-300 ${form.shuffleQuestions ? 'bg-primary-600' : 'bg-gray-400 dark:bg-gray-700'}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-all duration-300 ${form.shuffleQuestions ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
              <input type="checkbox" className="hidden" checked={form.shuffleQuestions} onChange={e => setForm(p => ({ ...p, shuffleQuestions: e.target.checked }))} />
              <span className={`text-sm font-bold uppercase tracking-wider ${form.shuffleQuestions ? 'text-primary-500' : 'text-gray-500'}`}>Shuffle Questions</span>
            </label>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={saveTest} disabled={saving} className={`btn-primary flex items-center gap-2 transition-all ${success ? 'bg-green-600 border-green-500' : ''}`}>
            {success ? <HiCheck className="w-5 h-5" /> : <HiOutlineDocumentCheck className="w-5 h-5" />}
            {saving ? 'Saving...' : success ? 'Saved Successfully!' : saved ? 'Update Test Details' : 'Save Test & Add Questions'}
          </button>
          {success && <span className="text-green-500 text-sm font-medium animate-in fade-in slide-in-from-left-2">All changes saved!</span>}
        </div>
      </div>

      {saved && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question List */}
          <div className="card space-y-2">
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Questions ({questions.length})</h2>
                <button onClick={() => { setQuestions(p => [...p, emptyQ()]); setActiveQ(questions.length); }}
                  className="btn-primary py-1 px-3 text-xs flex items-center gap-1">
                  <HiPlusSmall className="w-4 h-4" /> Add Question
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowAikenModal(true)}
                  className="btn-secondary flex-1 py-1.5 text-xs flex items-center justify-center gap-1">
                  <HiArrowUpTray className="w-3.5 h-3.5" /> Import
                </button>
                {questions.some(q => !q._id) && (
                  <button onClick={saveAllQuestions} disabled={saving}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 transition-all">
                    <HiOutlineDocumentCheck className="w-3.5 h-3.5" /> Save All
                  </button>
                )}
              </div>
            </div>
            <div className={`space-y-1 max-h-96 overflow-y-auto pr-1 divide-y ${listScroll}`}>
              {questions.map((q, i) => (
                <div key={q._id || q._temp || i}
                  onClick={() => setActiveQ(i)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all ${activeQ === i ? listActive : listItem}`}>
                  <HiArrowsUpDown className={`w-4 h-4 ${gripColor}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${textSub}`}>Q{i + 1} · {q.marks} Mark{(q.marks || 1) !== 1 ? 's' : ''}</p>
                    <p className="text-sm truncate">{q.text || 'Untitled Question'}</p>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <button onClick={e => { e.stopPropagation(); moveQ(i, -1); }} className="p-0.5 hover:text-primary-400"><HiChevronUp className="w-4 h-4" /></button>
                    <button onClick={e => { e.stopPropagation(); moveQ(i, 1); }} className="p-0.5 hover:text-primary-400"><HiChevronDown className="w-4 h-4" /></button>
                  </div>
                  <button onClick={e => { e.stopPropagation(); removeQuestion(i); }} className={`p-1 ${removeBtn}`}><HiXMark className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Question Editor */}
          <div className="card lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Question {activeQ + 1}</h2>
              <button onClick={() => saveQuestion(q, activeQ)} disabled={saving} className="btn-primary py-1.5 px-3 text-sm flex items-center gap-1">
                <HiOutlineDocumentCheck className="w-4 h-4" /> {saving ? '...' : 'Save Question'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Question Type</label>
                <select className="input" value={q.type || 'mcq-single'} onChange={e => {
                  const newType = e.target.value;
                  const updates = { type: newType, correctAnswer: '', options: ['', '', '', ''] };
                  if (newType === 'coding' && (!q.testCases || q.testCases.length === 0)) {
                    updates.testCases = [{ input: '', output: '', marks: 0, isPublic: false }];
                  } else if (newType !== 'coding') {
                    updates.testCases = [];
                  }
                  updateQ(activeQ, updates);
                }}>
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              {q.type !== 'coding' && (
                <div>
                  <label className="label">Marks</label>
                  <input type="number" className="input" min="1" value={q.marks || 1} onChange={e => updateQ(activeQ, { marks: +e.target.value })} />
                </div>
              )}
            </div>
            {(q.type === 'mcq-single' || q.type === 'mcq-multi') && (
              <div className="flex items-center gap-3 py-1">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-9 h-5 rounded-full p-1 transition-all duration-300 ${q.shuffleOptions ? 'bg-primary-600' : 'bg-gray-400 dark:bg-gray-700'}`}>
                    <div className={`w-3 h-3 rounded-full bg-white transition-all duration-300 ${q.shuffleOptions ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                  <input type="checkbox" className="hidden" checked={q.shuffleOptions || false} 
                    onChange={e => updateQ(activeQ, { shuffleOptions: e.target.checked })} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${q.shuffleOptions ? 'text-primary-500' : 'text-gray-500'}`}>Shuffle Options</span>
                </label>
              </div>
            )}
            <div>
              <label className="label">Tags (comma-separated)</label>
              <input className="input" placeholder="algebra, calculus" value={(q.tags || []).join(', ')}
                onChange={e => updateQ(activeQ, { tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })} />
            </div>
            <div>
              <label className="label">Question Text *</label>
              <textarea className="input h-20 resize-none" placeholder="Enter your question..." value={q.text || ''}
                onChange={e => updateQ(activeQ, { text: e.target.value })} />
            </div>
            <div>
              <label className="label">Answer {q.type?.startsWith('mcq') ? '(Select correct option)' : ''}</label>
              {renderAnswerInput()}
            </div>
            <div>
              <label className="label">Explanation (optional)</label>
              <input className="input" placeholder="Explain the correct answer..." value={q.explanation || ''}
                onChange={e => updateQ(activeQ, { explanation: e.target.value })} />
            </div>
          </div>
        </div>
      )}

      {/* Aiken Import Modal */}
      {showAikenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`card w-full max-w-2xl animate-in fade-in zoom-in duration-200 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold">Import Aiken Format</h3>
                <p className={`${textSub} text-xs mt-1`}>Paste text OR upload a .txt file in Aiken format</p>
              </div>
              <button onClick={() => setShowAikenModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <HiXMark className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="flex items-center gap-2 p-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-primary-500 cursor-pointer transition-all group">
                <HiArrowUpTray className="w-5 h-5 text-gray-400 group-hover:text-primary-500" />
                <span className="text-sm font-medium text-gray-500 group-hover:text-primary-500">Choose a .txt file to load content</span>
                <input type="file" accept=".txt" className="hidden" onChange={handleFileLoad} />
              </label>
            </div>
            
            <textarea
              className="input min-h-[250px] font-mono text-sm mb-4"
              placeholder={`What is the capital of France?\nA. London\nB. Paris\nC. Berlin\nANSWER: B\n\nWhich planet is Red?\nA. Earth\nB. Mars\nANSWER: B`}
              value={aikenText}
              onChange={(e) => setAikenText(e.target.value)}
            />
            
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAikenModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleAikenImport} disabled={!aikenText.trim()} className="btn-primary flex items-center gap-2">
                <HiArrowUpTray className="w-4 h-4" /> Finalize Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
