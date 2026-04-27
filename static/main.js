window.addEventListener('DOMContentLoaded',function(){
let mainSt={rec:'__not-found__',ori:0}
let afacingMode
//loc-aft username prompt
const username='mainuser'
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
})
document.querySelector(`[chnO="o"]`).addEventListener('click',function(){
if(orin==270){
   orin=0 
}
else{
    orin+=90
}
})
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
     mainSt={rec:imim,ori:orin}
     S.emit('Process',mainSt)
     },100)
     
    }
    catch(er){
        console.error(er)
    }
}
}
unRStream()
})
