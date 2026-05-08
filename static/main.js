window.addEventListener('DOMContentLoaded',async function(){
let mainSt={rec:'__not-found__',ori:0,stream:1,camname:'__not-found__'}
let afacingMode
if(!localStorage.getItem('fps')){
    localStorage.setItem('fps',50)
}
if(!localStorage.getItem('Username')){
    let usrn=prompt('Choose a name for the camera')
    if(usrn.trim()!=''){
        localStorage.setItem("Username",usrn)
    }
    else{
        alert('Name cannot be empty')
        window.location.reload()
    }
}
const username=localStorage.getItem('Username')
let fps=localStorage.getItem('fps')
//loc-aft username prompt
if(!localStorage.getItem('facingMode')){
    localStorage.setItem('facingMode','environment')
    afacingMode='environment'
}
else{
    afacingMode=localStorage.getItem('facingMode')
}
let contx$$RUNNING=false
let orin=0
const S=io()
let stream
S.emit('INFO','suggStream',ans=>{
    stream=ans.stream
})
S.emit('join',{clieUSR:username})
window.addEventListener('visibilitychange',function(){
    if(document.hidden){
        S.emit('CamMinimize',username)
    }
    else{
        S.emit('CamRevive',username)
    }
})
S.on('JSPrefREC',function(pref){
 if(Object.keys(pref)[0]=='face'){
  if(afacingMode=='environment'){
    afacingMode='user'
    localStorage.setItem('facingMode','user')
    window.location.reload()
  }
  else{
    afacingMode='environment'
    localStorage.setItem('facingMode','environment')
    window.location.reload()
  }
 }
 else if(Object.keys(pref)[0]=='fps'){
    if(pref.fps=='low'){
        localStorage.setItem('fps',100)
    }
    else if(pref.fps=='medium'){
        localStorage.setItem('fps',50)
    }
    else{
        localStorage.setItem('fps',10)
    }
    window.location.reload()
 }
})
document.querySelector(`[chnO="o"]`).addEventListener('click',function(){
if(orin==270){
   orin=0 
}
else{
    orin+=90
}
})
async function checkBattery(){
    if('getBattery'in navigator){
        let bat=await navigator.getBattery()
        return bat.level*100
    } 
    else{
        return '__not-supported__'
    } 
}
S.emit("BatteryChange",{"user": username,"status": await checkBattery()})        
localStorage.setItem('battery',await checkBattery())
if(localStorage.getItem('battery')!='__not-supported__'){
    setInterval(async ()=>{
    S.emit("BatteryChange",{"user": username,"status":await checkBattery()})        
    },300000)
}
else{
    S.emit("BatteryChange",{"user": username,"status": "__not-supported__"})  
}
async function unRStream(){
if(!navigator.mediaDevices||navigator.mediaDevices==undefined){
  mainSt={rec:'__not-allowed__'} 
}
else{
    try{ 
     let mainRT=await navigator.mediaDevices.getUserMedia({video: {facingMode : afacingMode}})
     let mainVD=document.querySelector('video')
     let mainC=document.querySelector(`[dupSEc='object']`)
     let CanV=mainC.getContext('2d')
     mainVD.srcObject=mainRT
     await new Promise(res=>mainVD.onloadedmetadata=res)
     mainC.width=mainVD.videoWidth
     mainC.height=mainVD.videoHeight
     setInterval(()=>{
     CanV.drawImage(mainVD,0,0,mainC.width,mainC.height)
     let imim=mainC.toDataURL('image/jpeg',0.6)
     console.log(imim)
     mainSt={rec:imim,ori:orin,stream:stream,camname:username}
     S.emit('Process',mainSt)
     },fps)
     
    }
    catch(er){
        console.error(er)
    }
}
}
unRStream()
})
