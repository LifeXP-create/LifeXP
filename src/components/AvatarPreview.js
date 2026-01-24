import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../theme";

const AURAS = {
  Mint: [theme.primary, "#00f0c8"],
  Blue: [theme.primary2, "#4dc3ff"],
  Gold: ["#F7C948", "#F59E0B"],
  None: ["transparent", "transparent"],
};

export default function AvatarPreview({ aura="Mint", color="#19222A", hat=null, top="Tee" }){
  const auraColors = AURAS[aura] ?? AURAS.Mint;
  return (
    <View style={s.wrap}>
      <LinearGradient colors={auraColors} start={{x:0,y:0}} end={{x:1,y:1}} style={s.aura}/>
      <View style={[s.body,{backgroundColor:color}]}/>
      {/* TOP (einfacher Kragen) */}
      {top && <View style={s.collar}/>}
      {/* HATS */}
      {hat==="Cap"    && <View style={s.cap}><View style={s.capBill}/></View>}
      {hat==="Beanie" && <View style={s.beanie}/>}
      {hat==="Halo"   && <View style={s.halo}/>}
    </View>
  );
}

const s = StyleSheet.create({
  wrap:{width:120,height:120,alignItems:"center",justifyContent:"center"},
  aura:{position:"absolute",width:120,height:120,borderRadius:60,opacity:0.25},
  body:{width:82,height:82,borderRadius:41,borderWidth:2,borderColor:"rgba(255,255,255,0.08)"},
  collar:{position:"absolute",bottom:20,width:44,height:14,borderRadius:8,backgroundColor:"#0E141B",borderWidth:1,borderColor:"rgba(255,255,255,0.06)"},
  cap:{position:"absolute",top:22,width:64,height:24,borderTopLeftRadius:10,borderTopRightRadius:10,backgroundColor:"#0E141B",borderWidth:1,borderColor:"rgba(255,255,255,0.08)",alignItems:"center"},
  capBill:{position:"absolute",bottom:-6,width:34,height:8,borderRadius:6,backgroundColor:"#0E141B",borderWidth:1,borderColor:"rgba(255,255,255,0.08)"},
  beanie:{position:"absolute",top:22,width:64,height:28,borderRadius:14,backgroundColor:"#1f2937",borderWidth:1,borderColor:"rgba(255,255,255,0.08)"},
  halo:{position:"absolute",top:12,width:70,height:70,borderRadius:35,borderWidth:3,borderColor:"#facc15",opacity:0.7},
});
