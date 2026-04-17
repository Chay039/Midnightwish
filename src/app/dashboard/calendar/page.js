"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import "../dashboard.css";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [wishes, setWishes] = useState([]);

  useEffect(() => {
    fetchWishes();
  }, []);

  const fetchWishes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if(!user) return;
    const { data } = await supabase.from('wishes').select('*').eq('user_id', user.id);
    if(data) setWishes(data);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const renderGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    // Previous month filler days
    const prevMonthDays = getDaysInMonth(year, month - 1);
    const cells = [];
    
    // Add blanks / previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
       const pbMonth = month === 0 ? 12 : month;
       const pbYear = month === 0 ? year - 1 : year;
       cells.push({ day: prevMonthDays - i, isOtherMonth: true, linkDate: `${pbYear}-${String(pbMonth).padStart(2, '0')}-${String(prevMonthDays - i).padStart(2, '0')}` });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
       cells.push({ day: i, isOtherMonth: false, linkDate: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}` });
    }
    
    // Next month filler days (to fill 42 cells grid = 6 rows)
    const remainingCells = 42 - cells.length;
    for (let i = 1; i <= remainingCells; i++) {
       const nbMonth = month === 11 ? 1 : month + 2;
       const nbYear = month === 11 ? year + 1 : year;
       cells.push({ day: i, isOtherMonth: true, linkDate: `${nbYear}-${String(nbMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}` });
    }

    const today = new Date();
    const isToday = (d) => today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;

    return cells.map((cell, index) => {
       // Find wishes for this specific day
       const dayWishes = wishes.filter(w => {
           if(cell.isOtherMonth) return false;
           const parts = w.date.split('-');
           // "1994-04-18" or "04-18"
           const wMonth = parseInt(parts.length === 3 ? parts[1] : parts[0]);
           const wDay = parseInt(parts.length === 3 ? parts[2] : parts[1]);
           return wDay === cell.day && wMonth === (month + 1);
       });

       return (
         <Link href={`/dashboard/add?date=${cell.linkDate}`} key={index} className={`calendar-cell ${cell.isOtherMonth ? 'is-other-month' : ''} ${!cell.isOtherMonth && isToday(cell.day) ? 'is-today' : ''}`}>
            <span className="date-num">{cell.day}</span>
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px'}}>
               {dayWishes.map(w => (
                  <div key={w.id} className="calendar-wish-badge" title={`${w.name} - ${w.event}`}>
                     {w.name}
                  </div>
               ))}
            </div>
         </Link>
       );
    });
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="calendar-container">
      <div className="calendar-header-nav">
        <h2 className="text-gradient-primary">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
        <div style={{display: 'flex', gap: '12px'}}>
           <button onClick={prevMonth}>
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg> Prev
           </button>
           <button onClick={nextMonth}>
             Next <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
           </button>
        </div>
      </div>
      
      <div className="calendar-grid">
         {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="calendar-weekday">{day}</div>
         ))}
         {renderGrid()}
      </div>
    </div>
  );
}
