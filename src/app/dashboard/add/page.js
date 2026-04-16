"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { COUNTRIES } from "@/lib/timeUtils";
import { useRouter } from "next/navigation";
import "../dashboard.css";

export default function AddWishPage() {
  const router = useRouter();
  const [circles, setCircles] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    eventType: "Birthday",
    date: "",
    circleId: "",
    country: "India",
    recurs: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCircles = async () => {
       const { data: { user } } = await supabase.auth.getUser();
       if(!user) return;
       const { data } = await supabase.from('circles').select('*').eq('user_id', user.id);
       if(data) {
          setCircles(data);
          if(data.length > 0) setFormData(f => ({ ...f, circleId: data[0].id }));
       }
    };
    fetchCircles();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();

    const selectedCountry = COUNTRIES.find(c => c.name === formData.country) || COUNTRIES[0];

    const { error } = await supabase.from('wishes').insert({
      user_id: user.id,
      name: formData.name,
      event: formData.eventType,
      date: formData.date,
      circle_id: formData.circleId || null,
      country: selectedCountry.name,
      timezone: selectedCountry.tz,
      recurs_yearly: formData.recurs
    });

    setIsSubmitting(false);
    if(error) {
       alert("Error adding wish: " + error.message);
    } else {
       router.push("/dashboard");
    }
  };

  return (
    <div className="add-wish-page" style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 0" }}>
      <h1 className="page-title text-gradient">Add New Wish</h1>
      
      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: "40px", display: "flex", flexDirection: "column", gap: "24px" }}>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ color: "#e2e8f0", fontSize: "0.95rem" }}>Recipient Name</label>
          <input 
            required
            type="text" 
            placeholder="e.g. Rahul Sharma"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={{ padding: "12px 16px", borderRadius: "var(--rad-md)", background: "rgba(255,255,255,0.05)", border: "1px solid var(--surface-border)", color: "#fff", fontSize: "1rem" }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ color: "#e2e8f0", fontSize: "0.95rem" }}>Event Type</label>
            <select 
                value={formData.eventType}
                onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                style={{ padding: "12px 16px", borderRadius: "var(--rad-md)", background: "rgba(255,255,255,0.05)", border: "1px solid var(--surface-border)", color: "#fff", fontSize: "1rem" }}>
              <option value="Birthday" style={{background: "#0a0a0a"}}>Birthday</option>
              <option value="Anniversary" style={{background: "#0a0a0a"}}>Anniversary</option>
              <option value="Custom" style={{background: "#0a0a0a"}}>Custom Reminder</option>
            </select>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ color: "#e2e8f0", fontSize: "0.95rem" }}>Date</label>
            <input 
              required
              type="date" 
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              style={{ padding: "12px 16px", borderRadius: "var(--rad-md)", background: "rgba(255,255,255,0.05)", border: "1px solid var(--surface-border)", color: "#fff", fontSize: "1rem", colorScheme: "dark" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ color: "#e2e8f0", fontSize: "0.95rem" }}>Recipient Country (For Timezone Sync)</label>
          <select 
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              style={{ padding: "12px 16px", borderRadius: "var(--rad-md)", background: "rgba(255,255,255,0.05)", border: "1px solid var(--surface-border)", color: "#fff", fontSize: "1rem" }}>
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.name} style={{background: "#0a0a0a"}}>{c.name} (Midnight {c.tz})</option>
            ))}
          </select>
          <small style={{ color: "#94a3b8" }}>We'll remind you exactly at midnight in this country.</small>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ color: "#e2e8f0", fontSize: "0.95rem" }}>Assign to Circle</label>
          <select 
              value={formData.circleId}
              onChange={(e) => setFormData({ ...formData, circleId: e.target.value })}
              style={{ padding: "12px 16px", borderRadius: "var(--rad-md)", background: "rgba(255,255,255,0.05)", border: "1px solid var(--surface-border)", color: "#fff", fontSize: "1rem" }}>
            <option value="" style={{background: "#0a0a0a"}}>-- None --</option>
            {circles.map(circ => (
              <option key={circ.id} value={circ.id} style={{background: "#0a0a0a"}}>{circ.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "10px" }}>
           <input 
              type="checkbox" 
              id="recurs"
              checked={formData.recurs}
              onChange={(e) => setFormData({ ...formData, recurs: e.target.checked })}
              style={{ width: "20px", height: "20px", accentColor: "var(--primary-light)" }}
           />
           <label htmlFor="recurs" style={{ color: "#94a3b8" }}>Recurs yearly?</label>
        </div>

        <button disabled={isSubmitting} type="submit" className="btn-primary" style={{ marginTop: "20px", width: "100%", justifyContent: "center" }}>
          {isSubmitting ? "Saving..." : "Add to Universe"}
        </button>
      </form>
    </div>
  );
}
