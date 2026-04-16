"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { COUNTRIES, getLocalMidnightEquivalent, getCurrentTimeInZone } from "@/lib/timeUtils";

export default function DashboardOverview() {
  const [wishes, setWishes] = useState([]);
  const [circles, setCircles] = useState([]);
  const [selectedDisplayTzName, setSelectedDisplayTzName] = useState("India");
  
  const [localMidnightEquiv, setLocalMidnightEquiv] = useState("");
  const [nowTarget, setNowTarget] = useState("");
  const [nowLocal, setNowLocal] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [cRes, wRes] = await Promise.all([
        supabase.from('circles').select('*').eq('user_id', user.id),
        supabase.from('wishes').select('*, circles(name)').eq('user_id', user.id)
      ]);

      if (cRes.data) setCircles(cRes.data);
      if (wRes.data) {
        // Calculate days left
        const enhancedWishes = wRes.data.map(w => {
           let daysLeft = 0;
           if (w.date) {
             const d = new Date(w.date);
             const now = new Date();
             d.setFullYear(now.getFullYear());
             if (d < now) d.setFullYear(now.getFullYear() + 1);
             daysLeft = Math.ceil((d.getTime() - now.getTime()) / (1000 * 3600 * 24));
           }
           return { ...w, daysLeft, circleName: w.circles?.name || 'Unassigned' };
        }).sort((a,b) => a.daysLeft - b.daysLeft);
        setWishes(enhancedWishes);
      }
    };
    fetchData();
  }, []);

  const activeCountrySetting = COUNTRIES.find(c => c.name === selectedDisplayTzName) || COUNTRIES[0];

  const handleDeleteWish = async (wishId) => {
      if (!confirm("Are you sure you want to permanently delete this wish?")) return;
      
      const { error } = await supabase.from('wishes').delete().eq('id', wishId);
      if (!error) {
         setWishes(wishes.filter(w => w.id !== wishId));
      } else {
         alert("Error deleting wish: " + error.message);
      }
  };

  useEffect(() => {
    // Calculate Temporal Alignment exactly
    const updateTimes = () => {
      const now = new Date();
      setNowLocal(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setNowTarget(getCurrentTimeInZone(activeCountrySetting.tz));
      setLocalMidnightEquiv(getLocalMidnightEquivalent(activeCountrySetting.tz));
    };

    updateTimes();
    const inv = setInterval(updateTimes, 60000); // update every minute
    return () => clearInterval(inv);
  }, [activeCountrySetting]);

  const nextEvent = wishes[0];

  return (
    <div className="dashboard-overview">
      <h1 className="page-title text-gradient">Your Universe</h1>
      <p className="page-subtitle">Track important dates across timezones seamlessly.</p>

      {/* Temporal Alignment Visualization */}
      <div className="temporal-alignment glass-panel" style={{ marginBottom: "40px", padding: "24px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid rgba(14, 165, 233, 0.3)"}}>
        <div style={{ flex: 1 }}>
           <h3 style={{ fontSize: "0.9rem", color: "#94a3b8", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px", display: 'flex', alignItems: 'center', gap: '8px' }}>
             Temporal Alignment
             <select 
               value={selectedDisplayTzName} 
               onChange={e => setSelectedDisplayTzName(e.target.value)}
               style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 8px' }}
             >
               {COUNTRIES.map(c => <option key={c.code} value={c.name} style={{background: '#0f172a'}}>{c.name}</option>)}
             </select>
           </h3>
           <h2 style={{ fontSize: "1.4rem", margin: 0 }}>Midnight in {activeCountrySetting.name}</h2>
           <p style={{ color: "var(--secondary)", marginTop: "4px" }}>is exactly <strong>{localMidnightEquiv}</strong> your local time.</p>
        </div>
        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
           <div style={{ textAlign: "center", padding: "12px", background: "rgba(255,255,255,0.05)", borderRadius: "var(--rad-md)", minWidth: "100px" }}>
             <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginBottom: "4px" }}>Right Now ({activeCountrySetting.code})</div>
             <strong style={{ fontSize: "1.2rem" }}>{nowTarget || '--:--'}</strong>
           </div>
           <div style={{ color: "var(--surface-border)" }}>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
           </div>
           <div style={{ textAlign: "center", padding: "12px", background: "rgba(255,255,255,0.05)", borderRadius: "var(--rad-md)", minWidth: "100px" }}>
             <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginBottom: "4px" }}>Your Time</div>
             <strong style={{ fontSize: "1.2rem", color: "var(--primary-light)" }}>{nowLocal || '--:--'}</strong>
           </div>
        </div>
      </div>

      {/* Up Next Card Highlight */}
      {nextEvent && (
        <div className="up-next-card glass-panel">
          <div className="up-next-header">
            <span className="badge badge-accent">Up Next</span>
            <span className="days-left">{nextEvent.daysLeft} Days Left</span>
          </div>
          <div className="up-next-content">
            <div className="event-info">
              <h2 className="event-name">{nextEvent.name}</h2>
              <p className="event-type">{nextEvent.event} &bull; {nextEvent.date}</p>
              <p className="event-circle text-gradient-primary">
                {nextEvent.circleName}
              </p>
            </div>
            <div className="event-action">
               <div className="reminder-status">
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-light)" strokeWidth="2"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/></svg>
                 <span>Gmail Scheduled for exactly Midnight in {nextEvent.country || 'India'}</span>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories/Circles Preview */}
      <div className="circles-preview-grid">
        {circles.length === 0 && <div style={{ color: '#94a3b8', padding: '10px' }}>No circles created yet.</div>}
        {circles.map(c => {
          const count = wishes.filter(w => w.circle_id === c.id).length;
          const isEmoji = c.name.match(/[\p{Extended_Pictographic}]/u);
          const emoji = isEmoji ? isEmoji[0] : null;
          const displayName = isEmoji ? c.name.replace(emoji, '').trim() : c.name;

          return (
            <Link key={c.id} href={`/dashboard/circles?c=${c.id}`} className="circle-card glass-panel" style={{ '--card-glow': c.color_gradient.match(/#[A-Za-z0-9]+/g)?.[0] || 'rgba(109, 40, 217, 0.2)' }}>
               <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: c.color_gradient, marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                 {emoji}
               </div>
               <h3>{displayName}</h3>
               <span className="count">{count} Wish{count !== 1 ? 'es' : ''} Upcoming</span>
            </Link>
          )
        })}
      </div>

      <div className="upcoming-list">
        <div className="list-header">
           <h3 className="list-title">All Upcoming Event Reminders</h3>
           <Link href="/dashboard/add" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>+ Add Wish</Link>
        </div>
        <div className="list-items glass-panel">
          {wishes.map((wish) => (
             <div key={wish.id} className="list-row" style={{ display: 'flex', alignItems: 'center' }}>
               <div className="row-main" style={{ flex: 1 }}>
                 <strong>{wish.name}</strong>
                 <div className="row-meta">{wish.event} ({wish.date}) &bull; {wish.country || 'India'}</div>
               </div>
               <div className="row-circle badge" style={{ marginRight: '16px' }}>{wish.circleName}</div>
               <div className="row-days" style={{ marginRight: '16px' }}>{wish.daysLeft} days left</div>
               <button onClick={() => handleDeleteWish(wish.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b", transition: "color 0.2s", padding: "8px" }} onMouseOver={(e) => {e.currentTarget.style.color = "#f43f5e"}} onMouseOut={(e) => {e.currentTarget.style.color = "#64748b"}} title="Delete Wish">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
               </button>
             </div>
          ))}
          {wishes.length === 0 && <div style={{padding: '24px', textAlign: 'center', color: '#94a3b8'}}>No events scheduled.</div>}
        </div>
      </div>
    </div>
  );
}
