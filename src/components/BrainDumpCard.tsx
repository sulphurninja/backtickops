// ========== components/BrainDumpCard.tsx ==========
'use client'
import { useState } from 'react'
export default function BrainDumpCard({ items, onChange }:{ items:string[]; onChange:(v:string[])=>void }){
const [text, setText] = useState('')
const add = ()=>{ if(!text.trim()) return; onChange([...(items||[]), text.trim()]); setText('') }
const toggleDone = (i:number)=>{
const it = items[i]
const next = [...items]
next[i] = it.startsWith('[done]') ? it.replace(/^\[done\]\s*/,'') : `[done] ${it}`
onChange(next)
}
const remove = (i:number)=>{ const next=[...items]; next.splice(i,1); onChange(next) }
return (
<div className="border border-zinc-800 rounded p-4">
<h2 className="font-semibold mb-3">Brain Dump</h2>
<div className="flex gap-2 mb-3">
<input value={text} onChange={e=>setText(e.target.value)} className="flex-1 px-3 py-2 bg-zinc-900 rounded border border-zinc-800" placeholder="Add item…" />
<button onClick={add} className="px-3 py-2 bg-white text-black rounded">Add</button>
</div>
<ul className="space-y-2">
{(items||[]).map((it, i)=> (
<li key={i} className="flex items-center gap-2">
<button onClick={()=>toggleDone(i)} className="h-5 w-5 rounded border border-zinc-700 flex items-center justify-center">
{it.startsWith('[done]') ? '✓' : ''}
</button>
<span className={it.startsWith('[done]') ? 'line-through opacity-60' : ''}>{it.replace(/^\[done\]\s*/,'')}</span>
<button onClick={()=>remove(i)} className="ml-auto text-xs opacity-60 hover:opacity-100">Remove</button>
</li>
))}
</ul>
</div>
)
}
