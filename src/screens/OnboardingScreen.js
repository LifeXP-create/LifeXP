
import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { theme } from "../theme";
import { useApp, AREAS } from "../context/AppState";
export default function OnboardingScreen(){
  const router=useRouter();
  const { setProfile, weeklyGoals, setWeeklyGoals, setReminder } = useApp();
  const [name,setName]=useState("Player");
  const [hour,setHour]=useState(19);
  const [minute,setMinute]=useState(30);
  function adjustGoal(area,delta){
    const v=Math.max(0, Math.min(14, (weeklyGoals[area]??0)+delta));
    setWeeklyGoals({...weeklyGoals, [area]: v});
  }
  function step(field,delta){
    const max = field==="hour"?24:60;
    const cur = field==="hour"?hour:minute;
    const v=((cur+delta)%max + max) % max;
    field==="hour"?setHour(v):setMinute(v);
  }
  async function finish(){
    setProfile(p=>({...p,name: name.trim() || "Player"}));
    setReminder(r=>({...r,hour,minute}));
    await AsyncStorage.setItem("lifexp_onboarded_v1","1");
    Alert.alert("Los geht’s","Quests sind bereit.");
    router.replace("/quests");
  }
  return (
    <View style={s.c}>
      <Text style={s.h1}>Willkommen bei LifeXP</Text>
      <Text style={s.sub}>Mach dein echtes Leben zum Game.</Text>
      <View style={s.card}>
        <Text style={s.label}>Dein Name</Text>
        <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Name" placeholderTextColor="#6b7280"/>
      </View>
      <View style={s.card}>
        <Text style={s.label}>Wochentargets</Text>
        {AREAS.map(a=>(
          <Row key={a} label={a} color={theme.areaColors[a]} value={weeklyGoals[a]??0} onPlus={()=>adjustGoal(a,1)} onMinus={()=>adjustGoal(a,-1)} />
        ))}
      </View>
      <View style={s.card}>
        <Text style={s.label}>Erinnerungszeit</Text>
        <Stepper label="Stunde" value={hour} onPlus={()=>step("hour",+1)} onMinus={()=>step("hour",-1)}/>
        <Stepper label="Minute" value={minute} onPlus={()=>step("minute",+5)} onMinus={()=>step("minute",-5)}/>
      </View>
      <TouchableOpacity style={s.btn} onPress={finish}>
        <Text style={s.btnT}>Start</Text>
      </TouchableOpacity>
    </View>
  );
}
function Row({label,color,value,onPlus,onMinus}){
  return (
    <View style={s.row}>
      <Text style={[s.area,{color}]}>{label}</Text>
      <View style={s.stepRow}>
        <TouchableOpacity onPress={onMinus} style={s.stepBtn}><Text style={s.stepBT}>-</Text></TouchableOpacity>
        <Text style={s.stepV}>{String(value)}</Text>
        <TouchableOpacity onPress={onPlus} style={s.stepBtn}><Text style={s.stepBT}>+</Text></TouchableOpacity>
      </View>
    </View>
  );
}
function Stepper({label,value,onPlus,onMinus}){
  return(
    <View style={{marginTop:8}}>
      <Text style={s.small}>{label}</Text>
      <View style={s.stepRow}>
        <TouchableOpacity onPress={onMinus} style={s.stepBtn}><Text style={s.stepBT}>-</Text></TouchableOpacity>
        <Text style={s.stepV}>{String(value).padStart(2,"0")}</Text>
        <TouchableOpacity onPress={onPlus} style={s.stepBtn}><Text style={s.stepBT}>+</Text></TouchableOpacity>
      </View>
    </View>
  );
}
const s=StyleSheet.create({
  c:{flex:1,backgroundColor:theme.bg,padding:16},
  h1:{color:theme.text,fontSize:24,fontWeight:"800"},
  sub:{color:theme.sub,marginTop:4,marginBottom:12},
  card:{backgroundColor:theme.card,borderRadius:16,padding:16,marginBottom:12,borderWidth:1,borderColor:"rgba(255,255,255,0.06)"},
  label:{color:theme.text,fontWeight:"700",marginBottom:8},
  input:{borderWidth:1,borderColor:"rgba(255,255,255,0.08)",borderRadius:12,padding:12,color:theme.text,backgroundColor:"#12151c"},
  row:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:8},
  area:{fontWeight:"800"},
  small:{color:theme.sub,marginBottom:6},
  stepRow:{flexDirection:"row",alignItems:"center",gap:8},
  stepBtn:{width:36,height:36,borderRadius:8,alignItems:"center",justifyContent:"center",backgroundColor:"#1a1f28"},
  stepBT:{color:theme.text,fontSize:18,fontWeight:"800"},
  stepV:{color:theme.text,fontSize:18,fontWeight:"800",width:44,textAlign:"center"},
  btn:{backgroundColor:theme.primary,borderRadius:14,paddingVertical:14,alignItems:"center",marginTop:6},
  btnT:{color:"#001014",fontWeight:"800"},
});
