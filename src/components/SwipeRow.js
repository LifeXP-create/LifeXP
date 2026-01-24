import React, { useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";

export default function SwipeRow({ children, onLeft, onRight, leftLabel="Erledigt", rightLabel="Löschen" }){
  const ref = useRef(null);
  const close = ()=>ref.current?.close();

  const Left = () => (
    <View style={[s.act,{backgroundColor:"#10b981"}]}>
      <Ionicons name="checkmark-circle-outline" size={22} color="#001014" />
      <Text style={s.t}>{leftLabel}</Text>
    </View>
  );
  const Right = () => (
    <View style={[s.act,{backgroundColor:"#ef4444", justifyContent:"flex-end"}]}>
      <Text style={s.t}>{rightLabel}</Text>
      <Ionicons name="trash-outline" size={22} color="#001014" />
    </View>
  );

  return (
    <Swipeable
      ref={ref}
      renderLeftActions={()=><Left/>}
      renderRightActions={()=><Right/>}
      onSwipeableOpen={(dir)=>{
        if(dir==="left"){ onLeft?.(); }
        if(dir==="right"){ onRight?.(); }
        close();
      }}
      overshootLeft={false}
      overshootRight={false}
    >
      {children}
    </Swipeable>
  );
}

const s=StyleSheet.create({
  act:{flex:1,flexDirection:"row",alignItems:"center",gap:10,paddingHorizontal:16,borderRadius:12,marginBottom:8},
  t:{color:"#001014",fontWeight:"800"},
});
