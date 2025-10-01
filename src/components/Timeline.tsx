// ========== components/Timeline.tsx ==========
'use client'
import { useState } from 'react'
function empty(){ return { start:'09:00', end:'10:00', label:'Focus block', focused:true } }
export default function Timeline({ blocks, onChange }:{ blocks:any[]; onChange:(v:any[])=>void }){
const [local, setLocal] = useState(blocks)
const add = ()=>{ const n=[...local, empty()]; setLocal(n); onChange(n) }
const set = (i:number, key:string, val:string|boolean)=>{ const n=[...local]; (n[i] as any)[key]=val; setLocal(n); onChange(n) }
const del = (i:number)=>{ const n=[...local]; n.splice(i,1); setLocal(n); onChange(n) }
return (
<div className="border border-zinc-800 rounded p-4">
<div className="flex items-center justify-between mb-3">
<h2 className="font-semibold">Daily Timebox Planner</h2>
<button onClick={add} className="px-3 py-2 border border-zinc-700 rounded">Add Block</button>
</div>
<div className="space-y-3">
{local.map((b,i)=> (
<div key={i} className="grid grid-cols-12 gap-2 items-center">
<input value={b.start} onChange={e=>set(i,'start',e.target.value)} className="col-span-2 px-2 py-2 bg-zinc-900 rounded border border-zinc-800" placeholder="HH:mm" />
<input value={b.end} onChange={e=>set(i,'end',e.target.value)} className="col-span-2 px-2 py-2 bg-zinc-900 rounded border border-zinc-800" placeholder="HH:mm" />
<input value={b.label} onChange={e=>set(i,'label',e.target.value)} className="col-span-6 px-2 py-2 bg-zinc-900 rounded border border-zinc-800" placeholder="Label" />
<label className="col-span-1 flex items-center gap-2 text-sm"><input type="checkbox" checked={!!b.focused} onChange={e=>set(i,'focused',e.target.checked)} /> Focus</label>
<button onClick={()=>del(i)} className="col-span-1 text-xs opacity-60 hover:opacity-100">Delete</button>
</div>
))}
{!local.length && <p className="opacity-60">No blocks yet. Add your first focus block.</p>}
</div>
</div>
)
}
