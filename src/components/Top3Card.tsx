// ========== components/Top3Card.tsx ==========
'use client'
export default function Top3Card({ values, onChange }:{ values:string[]; onChange:(v:string[])=>void }){
const set = (i:number, val:string)=>{ const next=[...values]; next[i]=val; onChange(next) }
return (
<div className="border border-zinc-800 rounded p-4">
<h2 className="font-semibold mb-3">Top 3 Priorities</h2>
<div className="space-y-2">
{([0,1,2] as const).map(i=> (
<input key={i} value={values?.[i]||''} onChange={e=>set(i,e.target.value)}
className="w-full px-3 py-2 bg-zinc-900 rounded border border-zinc-800" placeholder={`Priority #${i+1}`} />
))}
</div>
</div>
)
}
