// src/components/RewardModal.js
import React from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";
import { useApp } from "../context/AppState";

const rarityBadge = {
  common:"#9aa0a6",
  uncommon:"#6ee7b7",
  rare:"#60a5fa",
  epic:"#c084fc",
  legendary:"#fbbf24",
};

export default function RewardModal(){
  const { state, clearLastReward } = useApp();
  const data = state.lastReward;
  return (
    <Modal visible={!!data} transparent animationType="fade" onRequestClose={clearLastReward}>
      <View style={{flex:1,backgroundColor:"rgba(0,0,0,0.6)",justifyContent:"center",alignItems:"center",padding:24}}>
        <View style={{width:"100%",borderRadius:16,backgroundColor:"#111418",padding:20,borderWidth:1,borderColor:"#222"}}>
          {data ? (
            <>
              <Text style={{color:"#fff",fontSize:20,fontWeight:"800",marginBottom:8}}>Neuer Planet entdeckt</Text>
              <Text style={{color:"#9aa0a6",marginBottom:16}}>
                Galaxy: {data.galaxyKey.toUpperCase()}
              </Text>
              <View style={{padding:14,borderRadius:12,backgroundColor:"rgba(255,255,255,0.04)",marginBottom:16}}>
                <Text style={{color:"#fff",fontSize:18,fontWeight:"700"}}>{data.planet.name}</Text>
                <Text style={{color:rarityBadge[data.planet.rarity],marginTop:4, fontWeight:"700"}}>
                  {data.planet.rarity.toUpperCase()}
                </Text>
              </View>
              <TouchableOpacity onPress={clearLastReward}
                style={{backgroundColor:"#10b981",paddingVertical:12,borderRadius:10,alignItems:"center"}}>
                <Text style={{color:"#031314",fontWeight:"800"}}>Weiter</Text>
              </TouchableOpacity>
            </>
          ):null}
        </View>
      </View>
    </Modal>
  );
}
