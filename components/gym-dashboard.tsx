"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight, BarChart3, CalendarDays, ChevronDown, ChevronRight,
  CircleHelp, Dumbbell, Flame, Layers3, Menu, MoreHorizontal, Plus,
  Settings2, X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import AccountMenu from "@/components/account-menu";

type SetEntry = { id: number; reps: number; weight: number; unit: "kg" | "lb"; note: string };
type Exercise = { id: number; name: string; cue: string; sets: SetEntry[]; open?: boolean };

const initialExercises: Exercise[] = [
  { id: 1, name: "Pantorrillas", cue: "Controla la bajada · 3 series", open: true, sets: [
    { id: 1, reps: 14, weight: 95, unit: "lb", note: "" }, { id: 2, reps: 13, weight: 95, unit: "lb", note: "" }, { id: 3, reps: 11, weight: 95, unit: "lb", note: "" }
  ]},
  { id: 2, name: "Aductores cerrado", cue: "Máquina · 3 series", open: true, sets: [
    { id: 1, reps: 12, weight: 32, unit: "kg", note: "Última con ayuda" }, { id: 2, reps: 8, weight: 32, unit: "kg", note: "2 últimas con ayuda" }, { id: 3, reps: 8, weight: 25, unit: "kg", note: "Últimas 2 con 25 kg" }
  ]},
  { id: 3, name: "Prensa inclinada", cue: "Pendiente · 3 series", sets: [
    { id: 1, reps: 0, weight: 0, unit: "kg", note: "" }, { id: 2, reps: 0, weight: 0, unit: "kg", note: "" }, { id: 3, reps: 0, weight: 0, unit: "kg", note: "" }
  ]},
  { id: 4, name: "Extensión de cuádriceps", cue: "Pendiente · 3 series", sets: [
    { id: 1, reps: 0, weight: 0, unit: "kg", note: "" }, { id: 2, reps: 0, weight: 0, unit: "kg", note: "" }, { id: 3, reps: 0, weight: 0, unit: "kg", note: "" }
  ]},
];

const menu = [
  { label: "Hoy", icon: Dumbbell }, { label: "Progreso", icon: BarChart3 },
  { label: "Calendario", icon: CalendarDays }, { label: "Rutinas", icon: Layers3 },
];

export default function GymDashboard() {
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);
  const [active, setActive] = useState("Hoy");
  const [sideOpen, setSideOpen] = useState(false);
  const [showRoutine, setShowRoutine] = useState(false);
  const [saved, setSaved] = useState(false);
  const [routineName, setRoutineName] = useState("");

  useEffect(() => {
    const savedWorkout = window.localStorage.getItem("kilo-current-workout");
    if (savedWorkout) setExercises(JSON.parse(savedWorkout));
  }, []);

  const totalSets = useMemo(() => exercises.reduce((count, item) => count + item.sets.filter((set) => set.reps > 0).length, 0), [exercises]);
  const completed = Math.round((totalSets / exercises.reduce((count, item) => count + item.sets.length, 0)) * 100);

  function updateSet(exerciseId: number, setId: number, key: keyof SetEntry, value: string | number) {
    setExercises((current) => current.map((exercise) => exercise.id !== exerciseId ? exercise : {
      ...exercise, sets: exercise.sets.map((set) => set.id !== setId ? set : { ...set, [key]: key === "reps" || key === "weight" ? Number(value) : value })
    }));
  }
  function addSet(exerciseId: number) {
    setExercises((current) => current.map((exercise) => exercise.id !== exerciseId ? exercise : {
      ...exercise, sets: [...exercise.sets, { id: Date.now(), reps: 0, weight: 0, unit: "kg", note: "" }]
    }));
  }
  function toggle(exerciseId: number) {
    setExercises((current) => current.map((exercise) => exercise.id === exerciseId ? { ...exercise, open: !exercise.open } : exercise));
  }
  function saveWorkout() {
    window.localStorage.setItem("kilo-current-workout", JSON.stringify(exercises));
    setSaved(true); window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <main className="min-h-screen bg-[#101311] text-[#eff0e7] selection:bg-[#d6ff3f] selection:text-[#101311]">
      <div className="grain pointer-events-none fixed inset-0 opacity-30" />
      <header className="relative z-20 flex h-16 items-center justify-between border-b border-white/10 px-4 lg:hidden">
        <Brand />
        <Button variant="ghost" size="icon" className="text-[#d6ff3f]" onClick={() => setSideOpen(true)}><Menu /></Button>
      </header>
      <Sidebar active={active} setActive={setActive} open={sideOpen} close={() => setSideOpen(false)} />

      <section className="relative z-10 min-h-screen lg:ml-[250px]">
        <header className="hidden h-20 items-center justify-between border-b border-white/10 px-8 lg:flex">
          <div className="font-mono text-[11px] uppercase tracking-[.18em] text-white/45">Semana 39 · 2026</div>
          <div className="flex items-center gap-4">
            <AccountMenu />
          </div>
        </header>

        <div className="mx-auto max-w-[1480px] px-4 py-7 sm:px-7 lg:px-10 lg:py-10">
          <section className="mb-8 flex flex-col gap-6 lg:mb-10 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#d6ff3f] shadow-[0_0_14px_#d6ff3f]" /><span className="font-mono text-[11px] uppercase tracking-[.17em] text-[#d6ff3f]">Lunes · Día de piernas</span></div>
              <h1 className="font-heading text-5xl leading-[.85] font-semibold uppercase tracking-[-.045em] sm:text-7xl">Haz que cuente<span className="text-[#d6ff3f]">.</span></h1>
            </div>
            <div className="flex items-center gap-3 rounded-sm border border-white/10 bg-white/[.035] px-4 py-3">
              <Flame className="size-6 text-[#ff755f]" /><div><div className="font-heading text-xl leading-none uppercase">3 semanas</div><div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-white/45">racha actual</div></div>
            </div>
          </section>

          <section className="mb-8 grid gap-px overflow-hidden rounded-sm border border-white/10 bg-white/10 sm:grid-cols-3">
            <Metric label="Volumen hoy" value="3,897" suffix="kg" note="+12% vs. último lunes" accent />
            <Metric label="Series completas" value={`${totalSets}`} suffix=" / 12" note={`${completed}% de la rutina`} />
            <Metric label="Enfoque" value="Piernas" suffix="" note="Fuerza · hipertrofia" />
          </section>

          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <section>
              <div className="mb-3 flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-white/45">Entrenamiento activo</p><h2 className="font-heading text-3xl uppercase tracking-tight">Lunes · Lower 01</h2></div><Button variant="outline" size="sm" onClick={() => setShowRoutine(true)} className="border-white/15 bg-transparent font-mono text-[10px] uppercase tracking-wider text-white hover:bg-white/10 hover:text-white"><Plus /> Rutina</Button></div>
              <div className="space-y-2">
                {exercises.map((exercise, index) => <ExerciseCard key={exercise.id} exercise={exercise} index={index} toggle={() => toggle(exercise.id)} update={updateSet} add={() => addSet(exercise.id)} />)}
              </div>
              <button className="mt-3 flex w-full items-center justify-center gap-2 border border-dashed border-white/15 py-3 font-mono text-[10px] uppercase tracking-[.14em] text-white/45 transition hover:border-[#d6ff3f]/60 hover:text-[#d6ff3f]"><Plus className="size-3" /> Añadir ejercicio</button>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row"><Button onClick={saveWorkout} className="h-12 flex-1 rounded-none bg-[#d6ff3f] font-mono text-[11px] uppercase tracking-[.15em] text-[#101311] hover:bg-[#edff9c]"><Dumbbell /> {saved ? "Entrenamiento guardado" : "Guardar entrenamiento"}</Button><Button variant="outline" className="h-12 rounded-none border-white/15 bg-transparent font-mono text-[11px] uppercase tracking-[.15em] text-white/70 hover:bg-white/10 hover:text-white"><MoreHorizontal /> Notas del día</Button></div>
            </section>

            <aside className="space-y-5 xl:sticky xl:top-8">
              <Card className="gap-0 rounded-sm border-white/10 bg-[#171b18] py-0 shadow-none">
                <CardHeader className="border-b border-white/10 px-5 py-4"><CardTitle className="font-mono text-[10px] uppercase tracking-[.17em] text-white/50">Progreso semanal</CardTitle></CardHeader>
                <CardContent className="px-5 py-5"><div className="mb-5 flex items-end justify-between"><span className="font-heading text-5xl leading-none">2<span className="text-white/30">/3</span></span><span className="font-mono text-[10px] uppercase text-[#d6ff3f]">en ritmo</span></div><Progress value={67} className="[&_[data-slot=progress-indicator]]:bg-[#d6ff3f]" /><div className="mt-5 grid grid-cols-3 gap-1 font-mono text-[9px] uppercase"><WeekDay day="L" done /><WeekDay day="M" done /><WeekDay day="X" /></div></CardContent>
              </Card>
              <Card className="rounded-sm border-white/10 bg-[#171b18] py-0 shadow-none"><CardHeader className="flex-row items-center justify-between border-b border-white/10 px-5 py-4"><CardTitle className="font-mono text-[10px] uppercase tracking-[.17em] text-white/50">Señal de progreso</CardTitle><ArrowUpRight className="size-4 text-[#d6ff3f]" /></CardHeader><CardContent className="px-5 py-5"><p className="font-heading text-2xl leading-none uppercase">Pantorrillas</p><p className="mt-2 text-sm leading-relaxed text-white/55">Mantienes 95 lb y ganas repeticiones. En la próxima sesión, intenta 3 × 14.</p><div className="mt-5 flex h-16 items-end gap-2 border-b border-white/10 pb-1">{[35, 48, 46, 70, 58, 86, 76].map((value, index) => <div key={index} style={{ height: `${value}%` }} className={cn("flex-1", index === 6 ? "bg-[#d6ff3f]" : "bg-white/15")} />)}</div><div className="mt-2 flex justify-between font-mono text-[9px] text-white/35"><span>semana anterior</span><span>hoy</span></div></CardContent></Card>
              <div className="border-l-2 border-[#ff755f] bg-[#ff755f]/[.07] px-4 py-3"><p className="font-mono text-[10px] uppercase tracking-wider text-[#ff9d8c]">Atención</p><p className="mt-1 text-sm text-white/65">Aductores: baja un poco el peso si necesitas asistencia en más de 2 repeticiones.</p></div>
            </aside>
          </div>
        </div>
      </section>

      {showRoutine && <RoutineModal close={() => setShowRoutine(false)} name={routineName} setName={setRoutineName} />}
    </main>
  );
}

function Brand() { return <div className="flex items-center gap-2"><span className="flex size-8 items-center justify-center bg-[#d6ff3f] text-[#101311]"><Dumbbell className="size-4" /></span><span className="font-heading text-3xl leading-none uppercase tracking-tight">Kilo</span></div>; }
function Sidebar({ active, setActive, open, close }: { active: string; setActive: (name: string) => void; open: boolean; close: () => void }) { return <aside className={cn("fixed inset-y-0 left-0 z-40 flex w-[250px] flex-col border-r border-white/10 bg-[#101311] p-5 transition-transform lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}><div className="flex items-center justify-between"><Brand /><Button variant="ghost" size="icon-sm" onClick={close} className="lg:hidden"><X /></Button></div><div className="mt-11"><p className="mb-3 px-3 font-mono text-[9px] uppercase tracking-[.18em] text-white/30">Tu espacio</p>{menu.map(({ label, icon: Icon }) => <button key={label} onClick={() => { setActive(label); close(); }} className={cn("mb-1 flex w-full items-center gap-3 px-3 py-2.5 text-left font-mono text-[11px] uppercase tracking-[.12em] transition", active === label ? "bg-[#d6ff3f] text-[#101311]" : "text-white/45 hover:bg-white/5 hover:text-white")}><Icon className="size-4" />{label}</button>)}</div><div className="mt-auto"><button className="flex items-center gap-2 px-3 font-mono text-[10px] uppercase tracking-[.12em] text-white/35 hover:text-white"><Settings2 className="size-4" /> Ajustes</button></div></aside>; }
function Metric({ label, value, suffix, note, accent }: { label: string; value: string; suffix: string; note: string; accent?: boolean }) { return <div className="bg-[#151916] px-5 py-5"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-white/40">{label}</p><p className={cn("mt-2 font-heading text-4xl leading-none", accent && "text-[#d6ff3f]")}>{value}<span className="ml-1 text-xl text-white/40">{suffix}</span></p><p className="mt-2 font-mono text-[9px] uppercase tracking-wide text-white/40">{note}</p></div>; }
function WeekDay({ day, done }: { day: string; done?: boolean }) { return <div className={cn("flex aspect-square items-center justify-center border", done ? "border-[#d6ff3f] bg-[#d6ff3f] text-[#101311]" : "border-white/10 text-white/35")}>{done ? "✓" : day}</div>; }
function ExerciseCard({ exercise, index, toggle, update, add }: { exercise: Exercise; index: number; toggle: () => void; update: (exerciseId: number, setId: number, key: keyof SetEntry, value: string | number) => void; add: () => void }) { const done = exercise.sets.filter(set => set.reps > 0).length; return <article className="overflow-hidden border border-white/10 bg-[#171b18]"><button onClick={toggle} className="flex w-full items-center gap-4 px-4 py-4 text-left transition hover:bg-white/[.025] sm:px-5"><span className="font-mono text-[11px] text-[#d6ff3f]">0{index + 1}</span><div className="min-w-0 flex-1"><h3 className="font-heading text-2xl leading-none uppercase tracking-tight">{exercise.name}</h3><p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-white/35">{exercise.cue}</p></div><Badge variant="outline" className="hidden border-white/15 bg-transparent font-mono text-[9px] text-white/45 sm:inline-flex">{done}/{exercise.sets.length}</Badge>{exercise.open ? <ChevronDown className="size-4 text-white/50" /> : <ChevronRight className="size-4 text-white/50" />}</button>{exercise.open && <div className="border-t border-white/10 px-4 pb-4 pt-3 sm:px-5"><div className="grid grid-cols-[32px_1fr_1fr_28px] gap-2 border-b border-white/10 pb-2 font-mono text-[9px] uppercase tracking-wider text-white/35 sm:grid-cols-[42px_100px_100px_1fr]"><span>Serie</span><span>Reps</span><span>Peso</span><span className="hidden sm:block">Nota</span></div>{exercise.sets.map((set, itemIndex) => <div key={set.id} className="grid grid-cols-[32px_1fr_1fr_28px] items-center gap-2 border-b border-white/5 py-2.5 sm:grid-cols-[42px_100px_100px_1fr]"><span className="font-mono text-xs text-white/55">{itemIndex + 1}</span><input aria-label={`Repeticiones serie ${itemIndex + 1}`} value={set.reps || ""} onChange={(event) => update(exercise.id, set.id, "reps", event.target.value)} type="number" placeholder="—" className="h-8 w-full border border-white/10 bg-[#101311] px-2 font-mono text-xs text-white outline-none focus:border-[#d6ff3f]"/><div className="flex h-8 border border-white/10 bg-[#101311] focus-within:border-[#d6ff3f]"><input aria-label={`Peso serie ${itemIndex + 1}`} value={set.weight || ""} onChange={(event) => update(exercise.id, set.id, "weight", event.target.value)} type="number" placeholder="—" className="min-w-0 flex-1 bg-transparent px-2 font-mono text-xs text-white outline-none"/><button onClick={() => update(exercise.id, set.id, "unit", set.unit === "kg" ? "lb" : "kg")} className="border-l border-white/10 px-1.5 font-mono text-[9px] text-[#d6ff3f]">{set.unit}</button></div><input aria-label={`Nota serie ${itemIndex + 1}`} value={set.note} onChange={(event) => update(exercise.id, set.id, "note", event.target.value)} placeholder="Añadir nota" className="hidden h-8 w-full bg-transparent px-2 text-xs text-white/60 outline-none placeholder:text-white/20 sm:block"/><CircleHelp className="size-3 text-white/20 sm:hidden"/></div>)}<button onClick={add} className="mt-3 flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-white/40 hover:text-[#d6ff3f]"><Plus className="size-3"/> Añadir serie</button></div>}</article>; }
function RoutineModal({ close, name, setName }: { close: () => void; name: string; setName: (value: string) => void }) { return <Modal close={close}><p className="font-mono text-[10px] uppercase tracking-[.17em] text-[#d6ff3f]">Nueva plantilla</p><h2 className="mt-2 font-heading text-4xl uppercase">Crea una rutina</h2><label className="mt-6 block font-mono text-[10px] uppercase tracking-wider text-white/45">Nombre<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Miércoles upper" className="mt-2 h-11 w-full border border-white/15 bg-[#101311] px-3 text-sm text-white outline-none focus:border-[#d6ff3f]" /></label><div className="mt-6 flex gap-2"><Button onClick={close} className="h-11 flex-1 rounded-none bg-[#d6ff3f] font-mono text-[10px] uppercase tracking-wider text-[#101311]">Crear rutina</Button><Button onClick={close} variant="outline" className="h-11 rounded-none border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white">Cancelar</Button></div></Modal>; }
function Modal({ children, close }: { children: React.ReactNode; close: () => void }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={close}><div onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-md border border-white/15 bg-[#171b18] p-6 shadow-2xl">{children}</div></div>; }
