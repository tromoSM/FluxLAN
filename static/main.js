window.addEventListener('DOMContentLoaded',async function(){
let stealthMode=false
let st=document.querySelector('[stealth="b"]')
let mainpage=document.documentElement
st.addEventListener('click',function(){
    if(mainpage.requestFullscreen){mainpage.requestFullscreen()}
    else if(mainpage.webkitRequestFullscreen){mainpage.webkitRequestFullscreen()}
    else if(mainpage.webkitEnterFullscreen){mainpage.webkitEnterFullscreen()}
    else{alert(`failed to enable fullscreen mode. your browser doesnt support this feature.\nif you're using safari click "AA" and hide toolbar.`)}
    document.querySelector('video').style.opacity='0'
    alert('Double click anywhere to change the background color')
    let covr=document.createElement('cover')
    covr.style.position='fixed'
    covr.style.width="100%"
    covr.style.height="100%"
    covr.style.background='#fff'
    covr.style.display='block'
    covr.style.zIndex='999999'
    covr.style.top='0'
    covr.style.left='0'
    document.body.append(covr)
    stealthMode=true
    if(stealthMode){
        let col='white'
        window.addEventListener('dblclick',function(){
        if(col=='white'){document.querySelector('cover').style.background='black';col='black'}else{document.querySelector('cover').style.background='white';col='white'}
        document.body.style.background=col
        })
        let lastt=0
        window.addEventListener('touchend',function(){
            let savestate=Date.now()
            if(savestate-lastt<300){
            if(col=='white'){document.querySelector('cover').style.background='black';col='black'}else{document.querySelector('cover').style.background='white';col='white'}
            }
            lastt=savestate
            setTimeout(()=>{co.style.opacity='0'},900)
        })
}
})

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
S.on('ClientClear',async function(a){
S.emit('ClearedAll',username)
await localStorage.clear()
window.location.reload()
})
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
    // add ev listener to refresh as applycons to mainrt on chng
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
if(document.querySelector(`[chnO="o"]`)){
document.querySelector(`[chnO="o"]`).addEventListener('click',function(){
if(orin==270){
   orin=0 
}
else{
    orin+=90
}
})
}
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
S.on('CloseWhen',async function(prec){
    let current=await checkBattery
    if(current!='__not-supported__'){
        if(prec>=current){
            window.close()
        }
    }
})       
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

