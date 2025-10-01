// ========== app/(app)/planner/page.tsx ==========
'use client'
import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import Top3Card from '@/components/Top3Card'
import BrainDumpCard from '@/components/BrainDumpCard'
import Timeline from '@/components/Timeline'


export default function PlannerPage(){
const today = useMemo(()=>dayjs().format('YYYY-MM-DD'), [])
const [tb, setTb] = useState<any>(null)
const load = async ()=>{
const r = await fetch(`/api/timebox/${today}`)
const j = await r.json()
setTb(j)
}
useEffect(()=>{ load() },[today])
const save = async ()=>{
if(!tb) return
const r = await fetch(`/api/timebox/${today}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(tb) })
if(!r.ok) return alert('Save failed')
alert('Saved ✅')
}
if(!tb) return <div>Loading…</div>
return (
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
<div className="lg:col-span-1 space-y-6">
<Top3Card values={tb.top3} onChange={(v)=>setTb({...tb, top3:v})} />
<BrainDumpCard items={tb.brainDump} onChange={(v)=>setTb({...tb, brainDump:v})} />
</div>
<div className="lg:col-span-2">
<Timeline blocks={tb.blocks||[]} onChange={(blocks)=>setTb({...tb, blocks})} />
<div className="flex items-center gap-3 mt-4">
<button onClick={save} className="px-4 py-2 bg-white text-black rounded">Save</button>
<button onClick={()=>setTb({...tb, productivityScore: computePI(tb)})} className="px-4 py-2 border border-zinc-700 rounded">Recalc PI</button>
<div className="opacity-80">PI: {Math.round(tb.productivityScore||0)}</div>
</div>
</div>
</div>
)
}


function minutes(hhmm:string){ const [h,m]=hhmm.split(':').map(Number); return h*60+m }
function focusedMinutes(blocks:any[]){ return (blocks||[]).filter(b=>b.focused).reduce((s,b)=>s+(minutes(b.end)-minutes(b.start)),0) }
function computePI(tb:any){
const planMin = (tb.blocks||[]).reduce((s:any,b:any)=>s+(minutes(b.end)-minutes(b.start)),0) || 1
const focus = focusedMinutes(tb.blocks)
const prioritiesDone = (tb.top3||[]).filter((t:string)=>t && tb.brainDump?.includes(`[done] ${t}`)).length
const taskDone = (tb.brainDump||[]).filter((x:string)=>x.startsWith('[done]')).length
const taskTotal = (tb.brainDump||[]).length || 1
const pi = (focus/planMin)*50 + (prioritiesDone/3)*30 + (taskDone/taskTotal)*20
return Math.min(100, Math.round(pi))
}
