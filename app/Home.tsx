<div className="flex flex-col md:flex-row gap-4 w-full max-w-7xl mx-auto px-2 pb-24">

{/* Sloupec 1: K udělání */}

<div className="flex-1 min-h-[300px] bg-slate-100 rounded-2xl p-4">
{renderColumn('todo', 'K UDĚLÁNÍ')}
</div>

{/* Sloupec 2: V procesu */}

<div className="flex-1 min-h-[300px] bg-blue-50 rounded-2xl p-4">
{renderColumn('in-progress', 'V PROCESU')}
</div>

{/* Sloupec 3: Hotovo */}

<div className="flex-1 min-h-[300px] bg-green-50 rounded-2xl p-4">
{renderColumn('done', 'HOTOVO')}
</div>

</div>