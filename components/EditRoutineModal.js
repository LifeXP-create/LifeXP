import React from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";
import { AREAS } from "../context/AppState";

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

export default function EditRoutineModal({ visible, onClose, item, type="recurring", onSave, onDelete }){
  const isBad = type==="bad";
  const [title,setTitle]=React.useState("");
  const [area,setArea]=React.useState(isBad?"Wellbeing":"Productivity");
  const [kind,setKind]=React.useState("weekly");
  const [times,setTimes]=React.useState("2");
  const [difficulty,setDifficulty]=React.useState("2");
  const [intensity,setIntensity]=React.useState("0.2");

  const [weekDays,setWeekDays]=React.useState([]);
  const [monthDays,setMonthDays]=React.useState([]);
  const [yearDates,setYearDates]=React.useState([]);
  const [yyM,setYyM]=React.useState(""); const [yyD,setYyD]=React.useState("");

  const [note,setNote]=React.useState("");

  React.useEffect(()=>{
    setTitle(item?.title ?? "");
    setArea(item?.area ?? (isBad?"Wellbeing":"Productivity"));
    setKind(item?.kind ?? "weekly");
    setTimes(String(item?.times ?? 2));
    setDifficulty(String(item?.difficulty ?? 2));
    setIntensity(String(item?.intensity ?? 0.2));
    setWeekDays(item?.weekDays ?? []);
    setMonthDays(item?.monthDays ?? []);
    setYearDates(item?.yearDates ?? []);
    setYyM(""); setYyD("");
    setNote(item?.note ?? "");
  },[item,visible]);

  function save(){
    if(!title.trim()) return;
    if(isBad){
      onSave({ title:title.trim(), area, intensity:Number(intensity), note });
    }else{
      const patch={ title:title.trim(), area, kind, times:Number(times), difficulty:Number(difficulty), note };
      if(kind==="weekly")  patch.weekDays = weekDays;
      if(kind==="monthly") patch.monthDays = monthDays;
      if(kind==="yearly")  patch.yearDates = yearDates;
      onSave(patch);
    }
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":"height"} style={{flex:1,justifyContent:"flex-end"}} keyboardVerticalOffset={80}>
          <View style={s.sheet}>
            <View style={s.header}>
              <TouchableOpacity onPress={onClose} style={s.hBtn}><Ionicons name="close" size={20} color={theme.text}/></TouchableOpacity>
              <Text style={s.hTitle}>{isBad?"Bad Habit bearbeiten":"Routine bearbeiten"}</Text>
              <TouchableOpacity onPress={save} style={[s.hBtn,{backgroundColor:theme.primary,borderRadius:8,paddingHorizontal:10}]}><Text style={{color:"#001014",fontWeight:"800"}}>Speichern</Text></TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingBottom:8}}>
              <Label>Title</Label>
              <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="Titel…" placeholderTextColor="#778"/>

              <Label>Bereich</Label>
              <Row>{AREAS.map(a=><Chip key={a} active={area===a} onPress={()=>setArea(a)}>{a}</Chip>)}</Row>

              {!isBad && <>
                <Label>Typ</Label>
                <Row>{["daily","weekly","monthly","yearly"].map(k=><Chip key={k} active={kind===k} onPress={()=>setKind(k)}>{cap(k)}</Chip>)}</Row>

                {kind==="weekly" && (
                  <>
                    <Label>Wochentage</Label>
                    <Row>
                      {["So","Mo","Di","Mi","Do","Fr","Sa"].map((lbl,idx)=>(
                        <ToggleChip key={idx} active={(weekDays||[]).includes(idx)} onPress={()=>{
                          const set=new Set(weekDays||[]);
                          set.has(idx)? set.delete(idx): set.add(idx);
                          setWeekDays([...set].sort((a,b)=>a-b));
                        }}>{lbl}</ToggleChip>
                      ))}
                    </Row>
                    <Label>Häufigkeit (falls keine Tage gewählt)</Label>
                    <Num value={times} onChange={setTimes}/>
                  </>
                )}

                {kind==="monthly" && (
                  <>
                    <Label>Monatstage (1–31)</Label>
                    <Row>
                      {Array.from({length:31},(_,i)=>i+1).map(n=>(
                        <ToggleChip key={n} active={(monthDays||[]).includes(n)} onPress={()=>{
                          const set=new Set(monthDays||[]); set.has(n)?set.delete(n):set.add(n);
                          setMonthDays([...set].sort((a,b)=>a-b));
                        }}>{String(n)}</ToggleChip>
                      ))}
                    </Row>
                    <Label>Häufigkeit (falls keine Tage gewählt)</Label>
                    <Num value={times} onChange={setTimes}/>
                  </>
                )}

                {kind==="yearly" && (
                  <>
                    <Label>Feste Daten (MM-DD)</Label>
                    <Row>
                      <SmallInput placeholder="MM" val={yyM} setVal={v=>setYyM(v.replace(/[^0-9]/g,""))}/>
                      <SmallInput placeholder="DD" val={yyD} setVal={v=>setYyD(v.replace(/[^0-9]/g,""))}/>
                      <TouchableOpacity
                        onPress={()=>{
                          if(yyM&&yyD){
                            const m=String(clamp(Number(yyM),1,12)).padStart(2,"0");
                            const d=String(clamp(Number(yyD),1,31)).padStart(2,"0");
                            const v=`${m}-${d}`; const set=new Set(yearDates||[]); set.add(v);
                            setYearDates([...set]); setYyM(""); setYyD("");
                          }
                        }}
                        style={[s.chip,s.chipA]}><Text style={s.chipTA}>Hinzufügen</Text></TouchableOpacity>
                    </Row>
                    {Array.isArray(yearDates)&&yearDates.length>0 && (
                      <Row>
                        {yearDates.map(v=>(
                          <ToggleChip key={v} active onPress={()=>setYearDates((yearDates||[]).filter(x=>x!==v))}>{v} ✕</ToggleChip>
                        ))}
                      </Row>
                    )}
                    <Label>Häufigkeit (falls keine Daten gewählt)</Label>
                    <Num value={times} onChange={setTimes}/>
                  </>
                )}

                <Label>Schwierigkeit (1–3)</Label>
                <Num value={difficulty} onChange={setDifficulty}/>
              </>}

              {isBad && <>
                <Label>Intensität (0.1–1.0)</Label>
                <Num value={intensity} onChange={setIntensity} decimal />
              </>}

              <Label>KI-Notiz (optional)</Label>
              <TextInput
                style={[s.input,{minHeight:90,textAlignVertical:"top"}]}
                value={note}
                onChangeText={setNote}
                multiline
                placeholder="Kontext für spätere KI-Analyse…"
                placeholderTextColor="#778"
              />
              
              <TouchableOpacity onPress={onDelete} style={s.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color="#fff"/><Text style={s.deleteT}>Löschen</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function Label({children}){ return <Text style={s.label}>{children}</Text>; }
function Row({children}){ return <View style={s.row}>{children}</View>; }
function Chip({active,onPress,children}){ return <TouchableOpacity onPress={onPress} style={[s.chip,active&&s.chipA]}><Text style={[s.chipT,active&&s.chipTA]}>{children}</Text></TouchableOpacity>; }
function ToggleChip({active,onPress,children}){ return <TouchableOpacity onPress={onPress} style={[s.chip,active&&s.chipA]}><Text style={[s.chipT,active&&s.chipTA]}>{children}</Text></TouchableOpacity>; }
function SmallInput({placeholder,val,setVal}){ return <TextInput style={[s.input,{width:70}]} placeholder={placeholder} value={val} onChangeText={setVal} keyboardType="number-pad" maxLength={2}/>; }
function Num({value,onChange,decimal=false}){ return <TextInput style={s.input} value={value} onChangeText={v=>onChange(v.replace(decimal?/[^0-9.]/g:/[^0-9]/g,""))} keyboardType="decimal-pad" />; }
function cap(s){ return s[0].toUpperCase()+s.slice(1); }

const s=StyleSheet.create({
  backdrop:{flex:1,backgroundColor:"rgba(0,0,0,0.45)"},
  sheet:{backgroundColor:theme.card,padding:12,borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:"85%"},
  header:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:6},
  hBtn:{paddingVertical:6,paddingHorizontal:8},
  hTitle:{color:theme.text,fontWeight:"800"},
  label:{color:theme.sub,marginTop:8,marginBottom:6},
  input:{borderWidth:1,borderColor:"rgba(255,255,255,0.08)",borderRadius:12,padding:10,color:theme.text,backgroundColor:"#12151c"},
  row:{flexDirection:"row",flexWrap:"wrap",gap:8},
  chip:{paddingVertical:6,paddingHorizontal:10,borderRadius:999,borderWidth:1,borderColor:"rgba(255,255,255,0.12)"},
  chipA:{backgroundColor:theme.primary},
  chipT:{color:theme.text,fontSize:12},
  chipTA:{color:"#001014",fontWeight:"800"},
  deleteBtn:{marginTop:12,backgroundColor:"#ef4444",borderRadius:12,alignItems:"center",justifyContent:"center",flexDirection:"row",gap:8,paddingVertical:12},
  deleteT:{color:"#fff",fontWeight:"800"},
});
