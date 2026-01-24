import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../theme";

export default function ProgressBar({ value=0 }){
  const w=Math.max(0,Math.min(1,value));
  return (
    <View style={s.wrap}>
      <LinearGradient colors={[theme.primary,theme.primary2]} start={{x:0,y:0}} end={{x:1,y:0}} style={[s.fill,{width:`${w*100}%`}]} />
    </View>
  );
}
const s=StyleSheet.create({wrap:{height:8,backgroundColor:"#20232b",borderRadius:999,overflow:"hidden"},fill:{height:8}});
