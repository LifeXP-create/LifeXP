import React, { useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";

const AREAS = ["Body","Mind","Social","Productivity","Wellbeing"];

export default function AddQuestModal({ visible, onClose, onCreate }) {
  const [title,setTitle]=useState("");
  const [area,setArea]=useState("Body");
  const [diff,setDiff]=useState(2);

  function save(){
    if(!title.trim()) return;
    onCreate({ title:title.trim(), area, difficulty:diff });
    setTitle(""); setArea("Body"); setDiff(2); onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={s.sheet}>
          <Text style={s.h1}>Neue Quest</Text>
          <TextInput
            style={s.input}
            placeholder="Titel…"
            placeholderTextColor="#778"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={s.label}>Bereich</Text>
          <View style={s.row}>
            {AREAS.map(a=>(
              <TouchableOpacity key={a} onPress={()=>setArea(a)} style={[s.chip, area===a && s.chipA]}>
                <Text style={[s.chipT, area===a && s.chipTA]}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Difficulty</Text>
          <View style={s.row}>
            {[1,2,3].map(d=>(
              <TouchableOpacity key={d} onPress={()=>setDiff(d)} style={[s.chip, diff===d && s.chipA]}>
                <Text style={[s.chipT, diff===d && s.chipTA]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={s.btn} onPress={save} disabled={!title.trim()}>
            <Ionicons name="add-circle" size={18} color="#001014" />
            <Text style={s.btnT}>Hinzufügen</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const s=StyleSheet.create({
  backdrop:{flex:1,justifyContent:"flex-end",backgroundColor:"rgba(0,0,0,0.4)"},
  sheet:{backgroundColor:theme.card,padding:16,borderTopLeftRadius:20,borderTopRightRadius:20},
  h1:{color:theme.text,fontWeight:"800",fontSize:16,marginBottom:8},
  input:{borderWidth:1,borderColor:"rgba(255,255,255,0.08)",borderRadius:12,padding:12,color:theme.text,backgroundColor:"#12151c",marginBottom:12},
  label:{color:theme.sub,marginTop:4,marginBottom:6},
  row:{flexDirection:"row",flexWrap:"wrap",gap:8},
  chip:{paddingVertical:6,paddingHorizontal:10,borderRadius:999,borderWidth:1,borderColor:"rgba(255,255,255,0.08)"},
  chipA:{backgroundColor:theme.primary},
  chipT:{color:theme.text,fontSize:12},
  chipTA:{color:"#001014",fontWeight:"800"},
  btn:{marginTop:14,flexDirection:"row",gap:6,alignItems:"center",justifyContent:"center",backgroundColor:theme.primary,borderRadius:12,paddingVertical:12},
  btnT:{color:"#001014",fontWeight:"800"},
});
