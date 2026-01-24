import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppState";
import { theme } from "../theme";
import EditEventModal from "../components/EditEventModal";

const pad = n => String(n).padStart(2,"0");
const toISO = (d)=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const startOfISOWeek = (d)=>{ const x=new Date(d); const day=(x.getDay()+6)%7; x.setDate(x.getDate()-day); x.setHours(0,0,0,0); return x; }; // Mo
const addDays=(d,n)=>{ const x=new Date(d); x.setDate(x.getDate()+n); return x; };
const weekNumber=(d)=>{ const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())); const day=(t.getUTCDay()+6)%7; t.setUTCDate(t.getUTCDate()-day+3); const first=new Date(Date.UTC(t.getUTCFullYear(),0,4)); return 1+Math.round(((t-first)/86400000-3+((first.getUTCDay()+6)%7))/7); };

export default function CalendarScreen(){
  const { events, history, addEvent, updateEvent, moveEvent, removeEvent } = useApp();
  const [offset,setOffset]=React.useState(0); // 0 = aktuelle Woche
  const [sheet,setSheet]=React.useState({ open:false, dateISO:null, item:null });

  const weekStart = React.useMemo(()=>addDays(startOfISOWeek(new Date()), offset*7),[offset]);
  const days = React.useMemo(()=>Array.from({length:7},(_,i)=>addDays(weekStart,i)),[weekStart]); // Mo–So
  const dayISO = days.map(d=>toISO(d));
  const weekLabel = `Woche ${weekNumber(weekStart)}`;
  const dayNames = ["Mo","Di","Mi","Do","Fr","Sa","So"];

  function openNew(dateISO){ setSheet({ open:true, dateISO, item:null }); }
  function openEdit(dateISO,item){ setSheet({ open:true, dateISO, item }); }

  function saveEvent(data){
    if(sheet.item){
      if(sheet.dateISO===data.dateISO) updateEvent(data.dateISO, sheet.item.id, data);
      else moveEvent(sheet.dateISO, data.dateISO, sheet.item.id, data);
    } else {
      addEvent(data);
    }
  }

  // ---- Stats für aktuelle Woche
  const counts = dayISO.map(d => history?.[d]?.completed ?? 0);
  const maxC = Math.max(1, ...counts);
  const totalW = counts.reduce((a,b)=>a+b,0);

  return (
    <View style={s.c}>
      <View style={s.header}>
        <TouchableOpacity onPress={()=>setOffset(o=>o-1)} style={s.arrow}><Ionicons name="chevron-back" size={20} color={theme.text}/></TouchableOpacity>
        <Text style={s.h1}>{weekLabel}</Text>
        <TouchableOpacity onPress={()=>setOffset(o=>o+1)} style={s.arrow}><Ionicons name="chevron-forward" size={20} color={theme.text}/></TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:8}}>
        {days.map((d,idx)=>(
          <View key={idx} style={s.dayCol}>
            <View style={s.dayHeader}>
              <Text style={s.dayName}>{dayNames[idx]}</Text>
              <Text style={s.dayDate}>{pad(d.getDate())}.{pad(d.getMonth()+1)}.</Text>
            </View>

            {(events[dayISO[idx]]||[]).map(ev=>(
              <TouchableOpacity key={ev.id} onPress={()=>openEdit(dayISO[idx],ev)} style={s.card}>
                <Text style={s.cardTitle} numberOfLines={1}>{ev.title}</Text>
                <Text style={s.cardMeta}>{ev.start}–{ev.end}{ev.location?` · ${ev.location}`:""}</Text>
                {!!ev.note && <Text style={s.cardNote} numberOfLines={2}>{ev.note}</Text>}
              </TouchableOpacity>
            ))}

            <TouchableOpacity onPress={()=>openNew(dayISO[idx])} style={s.addBtn}>
              <Ionicons name="add" size={16} color="#001014"/><Text style={s.addT}>Termin</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Wochen-Statistik unten */}
      <View style={s.statsBox}>
        <View style={s.statsHeader}>
          <Text style={s.statsTitle}>Abgeschlossen pro Tag</Text>
          <Text style={s.statsTotal}>Woche: {totalW}</Text>
        </View>
        <View style={s.barRow}>
          {counts.map((c,i)=>(
            <View key={i} style={s.barItem}>
              <View style={[s.bar, {height: 6 + Math.round((c/maxC)*54)}]} />
              <Text style={s.barLabel}>{dayNames[i]}</Text>
              <Text style={s.barVal}>{c}</Text>
            </View>
          ))}
        </View>
      </View>

      <EditEventModal
        visible={sheet.open}
        onClose={()=>setSheet({open:false,dateISO:null,item:null})}
        initDateISO={sheet.dateISO}
        item={sheet.item}
        onSave={saveEvent}
        onDelete={()=>removeEvent(sheet.dateISO, sheet.item.id)}
      />
    </View>
  );
}

const s=StyleSheet.create({
  c:{flex:1,backgroundColor:theme.bg,paddingTop:8},
  header:{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8,marginBottom:6},
  h1:{color:theme.text,fontWeight:"800"},
  arrow:{padding:8},
  dayCol:{width:220, padding:8},
  dayHeader:{paddingVertical:6,alignItems:"center"},
  dayName:{color:theme.text,fontWeight:"800"},
  dayDate:{color:theme.sub,marginTop:2},
  card:{backgroundColor:theme.card,borderRadius:12,borderWidth:1,borderColor:"rgba(255,255,255,0.06)",padding:10,marginBottom:8},
  cardTitle:{color:theme.text,fontWeight:"700"},
  cardMeta:{color:theme.sub,fontSize:12,marginTop:2},
  cardNote:{color:theme.sub,fontSize:12,marginTop:4,opacity:0.9},
  addBtn:{flexDirection:"row",alignItems:"center",gap:6,alignSelf:"center",marginTop:4,backgroundColor:theme.primary,borderRadius:999,paddingHorizontal:12,paddingVertical:8},
  addT:{color:"#001014",fontWeight:"800"},

  // Stats
  statsBox:{paddingHorizontal:12,paddingTop:8,paddingBottom:10, borderTopWidth:1, borderColor:"rgba(255,255,255,0.06)"},
  statsHeader:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:6},
  statsTitle:{color:theme.text,fontWeight:"800"},
  statsTotal:{color:theme.sub},
  barRow:{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-end",gap:8,marginTop:2},
  barItem:{alignItems:"center",flex:1},
  bar:{width:16,borderRadius:6,backgroundColor:theme.primary,opacity:0.95},
  barLabel:{color:theme.sub,fontSize:11,marginTop:4},
  barVal:{color:theme.text,fontSize:12,marginTop:2},
});
