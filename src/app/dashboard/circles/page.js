"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import "../dashboard.css";

function CirclesContent() {
  const searchParams = useSearchParams();
  const activeCircleId = searchParams?.get('c');

  const [circles, setCircles] = useState([]);
  const [wishes, setWishes] = useState([]);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [newCircleName, setNewCircleName] = useState("");

  const fetchCircles = async () => {
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) return;
     
     const { data, error } = await supabase.from('circles').select('*').eq('user_id', user.id);
     if (data) setCircles(data);
  };

  const fetchWishes = async () => {
    if (!activeCircleId) return;
    const { data } = await supabase.from('wishes').select('*').eq('circle_id', activeCircleId);
    if(data) setWishes(data);
  };

  useEffect(() => { fetchCircles(); }, []);
  useEffect(() => { fetchWishes(); }, [activeCircleId]);

  const activeCircle = circles.find(c => c.id === activeCircleId) || circles[0] || null;

  const handleAddCircle = async () => {
      if(!newCircleName) return;
      const { data: { user } } = await supabase.auth.getUser();
      
      const gradients = [
        "linear-gradient(135deg, #8b5cf6, #d946ef)",
        "linear-gradient(135deg, #0ea5e9, #38bdf8)",
        "linear-gradient(135deg, #f43f5e, #fb7185)",
        "linear-gradient(135deg, #10b981, #34d399)"
      ];
      const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];

      const { data, error } = await supabase.from('circles').insert({
         user_id: user.id,
         name: newCircleName,
         color_gradient: randomGradient
      }).select().single();

      if(data) {
         setCircles([...circles, data]);
         setNewCircleName("");
         setIsAddingMode(false);
      }
  };

  const handleDeleteCircle = async (id) => {
      if (!confirm("Are you sure you want to delete this circle? Any scheduled wishes in this circle will be preserved but marked as unassigned.")) return;
      
      const { error } = await supabase.from('circles').delete().eq('id', id);
      if (!error) {
         setCircles(circles.filter(c => c.id !== id));
         // Optional: push to /dashboard/circles so it drops the active ?c= parameter
         window.history.pushState(null, '', '/dashboard/circles');
      } else {
         alert("Error deleting circle: " + error.message);
      }
  };

  const handleDeleteWish = async (wishId) => {
      if (!confirm("Are you sure you want to permanently delete this wish?")) return;
      
      const { error } = await supabase.from('wishes').delete().eq('id', wishId);
      if (!error) {
         setWishes(wishes.filter(w => w.id !== wishId));
      } else {
         alert("Error deleting wish: " + error.message);
      }
  };

  return (
    <>
      <h1 className="page-title text-gradient">My Circles</h1>
      <p className="page-subtitle">Organize your contacts so you never miss out.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "40px" }}>
        
        {/* Left Col: Master List of Circles */}
        <div className="circles-list glass-panel" style={{ padding: "0" }}>
           <div style={{ padding: "20px", borderBottom: "1px solid var(--surface-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
             <h3 style={{ margin: 0 }}>Groups</h3>
             <button onClick={() => setIsAddingMode(!isAddingMode)} style={{ background: "none", border: "none", color: "var(--primary-light)", cursor: "pointer", fontWeight: "bold" }}>+ Add</button>
           </div>
           
           {isAddingMode && (
             <div style={{ padding: "20px", borderBottom: "1px solid var(--surface-border)", background: "rgba(255,255,255,0.02)" }}>
               <div style={{ marginBottom: '16px' }}>
                 <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 8px 0' }}>Quick Add:</p>
                 <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                   <button onClick={() => {setNewCircleName("🤝 Best Friends");}} className="badge" style={{background: 'var(--surface-2)', cursor: 'pointer', border: '1px solid var(--surface-border)', color: "white"}}>🤝 Friends</button>
                   <button onClick={() => {setNewCircleName("🏡 Family");}} className="badge" style={{background: 'var(--surface-2)', cursor: 'pointer', border: '1px solid var(--surface-border)', color: "white"}}>🏡 Family</button>
                   <button onClick={() => {setNewCircleName("💼 Colleagues");}} className="badge" style={{background: 'var(--surface-2)', cursor: 'pointer', border: '1px solid var(--surface-border)', color: "white"}}>💼 Colleagues</button>
                 </div>
               </div>
               <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 8px 0' }}>Or custom (add an emoji!):</p>
               <input 
                 autoFocus
                 type="text" 
                 placeholder="e.g. 🧗‍♀️ Climbing Club" 
                 value={newCircleName}
                 onChange={(e) => setNewCircleName(e.target.value)}
                 style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--surface-border)", background: "transparent", color: "white", marginBottom: "8px" }}
               />
               <button onClick={handleAddCircle} className="btn-primary" style={{ padding: "8px 12px", width: "100%", fontSize: "0.9rem", justifyContent: 'center' }}>Save Circle</button>
             </div>
           )}

           <div>
             {circles.length === 0 && !isAddingMode && (
               <div style={{padding: '30px 20px', color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6', textAlign: 'center'}}>
                 <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🌍</div>
                 Plan accordingly and never miss a reminder.<br/><br/>
                 Allocate your favorite people to circles like <strong style={{color:"white"}}>Friends</strong>, <strong style={{color:"white"}}>Colleagues</strong>, or <strong style={{color:"white"}}>Family</strong>, or click Add to create your own custom tags!
               </div>
             )}
             {circles.map((circle) => {
                const isEmoji = circle.name.match(/[\p{Extended_Pictographic}]/u);
                const emoji = isEmoji ? isEmoji[0] : null;
                const displayName = isEmoji ? circle.name.replace(emoji, '').trim() : circle.name;

                return (
                  <Link key={circle.id} href={`/dashboard/circles?c=${circle.id}`} style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    padding: "16px 20px", 
                    borderBottom: "1px solid var(--surface-border)",
                    background: activeCircle?.id === circle.id ? "var(--surface-2)" : "transparent"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                       <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: circle.color_gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                         {emoji}
                       </div>
                       <strong style={{ color: activeCircle?.id === circle.id ? "#fff" : "#94a3b8" }}>{displayName}</strong>
                    </div>
                  </Link>
                )
             })}
           </div>
        </div>

        {/* Right Col: Detail View */}
        <div className="circle-detail glass-panel" style={{ padding: "40px", position: "relative" }}>
           {activeCircle ? (
             <>
               <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "40px" }}>
                 <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                   {(() => {
                      let emoji = null;
                      let displayName = activeCircle.name;
                      const firstSpace = activeCircle.name.indexOf(' ');
                      if (firstSpace !== -1) {
                        const firstWord = activeCircle.name.substring(0, firstSpace);
                        if (!/^[a-zA-Z0-9]$/.test(firstWord.charAt(0))) {
                           emoji = firstWord;
                           displayName = activeCircle.name.substring(firstSpace + 1);
                        }
                      }
                      return (
                        <>
                          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: activeCircle.color_gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem" }}>
                            {emoji}
                          </div>
                          <div>
                            <h2 style={{ fontSize: "2rem", margin: 0 }}>{displayName}</h2>
                            <p style={{ color: "#94a3b8", margin: 0 }}>{wishes.length} scheduled wishes</p>
                          </div>
                        </>
                      )
                   })()}
                 </div>
                 
                 <button 
                  onClick={() => handleDeleteCircle(activeCircle.id)}
                  style={{ background: "rgba(244, 63, 94, 0.1)", color: "#f43f5e", border: "1px solid rgba(244, 63, 94, 0.2)", borderRadius: "var(--rad-md)", padding: "8px 16px", cursor: "pointer", fontSize: "0.9rem", transition: "all 0.2s" }}
                  onMouseOver={(e) => { e.currentTarget.style.background = "rgba(244, 63, 94, 0.2)" }}
                  onMouseOut={(e) => { e.currentTarget.style.background = "rgba(244, 63, 94, 0.1)" }}
                 >
                   Delete Circle
                 </button>
               </div>

               <div className="list-items" style={{ border: "1px solid var(--surface-border)", borderRadius: "var(--rad-md)" }}>
                  {wishes.length === 0 && <div style={{padding: '16px', color: '#94a3b8'}}>No wishes in this circle.</div>}
                  {wishes.map(wish => (
                    <div key={wish.id} className="list-row" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--surface-border)" }}>
                       <div>
                         <strong style={{display: "block", marginBottom: "4px"}}>{wish.name}</strong>
                         <span style={{fontSize: "0.85rem", color: "#94a3b8"}}>{wish.event} ({wish.date}) &middot; {wish.country}</span>
                       </div>
                       <button onClick={() => handleDeleteWish(wish.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b", transition: "color 0.2s" }} onMouseOver={(e) => {e.currentTarget.style.color = "#f43f5e"}} onMouseOut={(e) => {e.currentTarget.style.color = "#64748b"}} title="Delete Wish">
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                       </button>
                    </div>
                  ))}
               </div>
             </>
           ) : (
             <div style={{ color: "#94a3b8", textAlign: "center", marginTop: "40px" }}>
               {circles.length > 0 ? "Select a circle to view details." : "Create your first circle to start organizing."}
             </div>
           )}
        </div>
      </div>
    </>
  );
}

export default function CirclesPage() {
  return (
    <div className="circles-page">
      <Suspense fallback={<div>Loading circles...</div>}>
        <CirclesContent />
      </Suspense>
    </div>
  );
}
