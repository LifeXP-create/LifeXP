import React from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";

export default function GalaxyDetailModal({ visible, onClose, area, level=1, data=[], onAdd, onRemove, galaxyName }){
  const [name,setName]=React.useState("");
  const [size,setSize]=React.useState("1");
  const [rarity,setRarity]=React.useState("common");

  React.useEffect(()=>{ setName(""); setSize("1"); setRarity("common"); },[visible,area]);

  function add(){
    const n=name.trim(); if(!n) return;
    onAdd({ name:n, size: Math.max(1,Math.min(5,Number(size)||1)), rarity });
    setName(""); setSize("1"); setRarity("common");
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.card}>
          <View style={s.header}>
            <Text style={s.h1}>{galaxyName}</Text>
            <View style={s.pill}><Ionicons name="rocket-outline" size={14} color="#001014"/><Text style={s.pillT}>L{level}</Text></View>
            <TouchableOpacity onPress={onClose} style={s.x}><Ionicons name="close" size={20} color={theme.text}/></TouchableOpacity>
          </View>

          <View style={s.row}>
            <TextInput style={[s.input,{flex:1}]} placeholder="Planet-Name" placeholderTextColor="#778" value={name} onChangeText={setName}/>
            <TextInput style={[s.input,{width:70,textAlign:"center"}]} placeholder="Size 1–5" keyboardType="number-pad" value={size} onChangeText={v=>setSize(v.replace(/[^0-9]/g,""))}/>
            <TouchableOpacity onPress={()=>setRarity(nextRarity(rarity))} style={s.rarity}>
              <Text style={s.rarityT}>{rarityLabel(rarity)}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={add} style={s.add}><Text style={s.addT}>Add</Text></TouchableOpacity>
          </View>

          <FlatList
            data={data}
            keyExtractor={i=>i.id}
            ListEmptyComponent={<Text style={s.empty}>Noch keine Planeten.</Text>}
            renderItem={({item})=>(
              <View style={s.item}>
                <Text style={s.itemT}>{item.name}</Text>
                <Text style={s.meta}>Size {item.size} · {rarityLabel(item.rarity)}</Text>
                <TouchableOpacity onPress={()=>onRemove(item.id)} style={s.del}><Ionicons name="trash-outline" size={18} color="#fff"/></TouchableOpacity>
              </View>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

function nextRarity(r){ return r==="common"?"rare":r==="rare"?"epic":"common"; }
function rarityLabel(r){ return r==="common"?"Common":r==="rare"?"Rare":"Epic"; }

const s=StyleSheet.create({
  backdrop:{flex:1,backgroundColor:"rgba(0,0,0,0.55)",justifyContent:"center",padding:16},
  card:{backgroundColor:theme.card,borderRadius:16,borderWidth:1,borderColor:"rgba(255,255,255,0.06)",maxHeight:"85%",padding:12},
  header:{flexDirection:"row",alignItems:"center",gap:8,marginBottom:8},
  h1:{color:theme.text,fontWeight:"800",flex:1},
  pill:{flexDirection:"row",alignItems:"center",gap:6,backgroundColor:theme.primary,borderRadius:999,paddingVertical:5,paddingHorizontal:10},
  pillT:{color:"#001014",fontWeight:"800",fontSize:12},
  x:{padding:6},

  row:{flexDirection:"row",alignItems:"center",gap:8,marginBottom:8},
  input:{borderWidth:1,borderColor:"rgba(255,255,255,0.08)",borderRadius:12,padding:10,color:theme.text,backgroundColor:"#12151c"},
  rarity:{backgroundColor:"#0f172a",borderRadius:10,paddingHorizontal:10,paddingVertical:8,borderWidth:1,borderColor:"rgba(255,255,255,0.08)"},
  rarityT:{color:theme.text,fontWeight:"700"},
  add:{backgroundColor:theme.primary,borderRadius:10,paddingHorizontal:12,paddingVertical:9},
  addT:{color:"#001014",fontWeight:"800"},

  item:{backgroundColor:"rgba(6,8,12,0.6)",borderRadius:12,borderWidth:1,borderColor:"rgba(255,255,255,0.06)",padding:12,marginBottom:8},
  itemT:{color:theme.text,fontWeight:"800"},
  meta:{color:theme.sub,marginTop:4},
  del:{position:"absolute",right:8,top:8,backgroundColor:"#ef4444",borderRadius:8,padding:6},
  empty:{color:theme.sub,marginTop:6,textAlign:"center"},
});
