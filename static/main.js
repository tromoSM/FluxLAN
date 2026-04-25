window.addEventListener('DOMContentLoaded',function(){
let mainSt={rec:'__not-found__',ori:"up"}
let contx$$RUNNING=false
let orin='up'
document.querySelector(`[chnO="o"]`).addEventListener('click',function(){
if(orin=='up'){
    orin='side'
}
else{
    orin='up'
}
})
async function unRStream(){
if(!navigator.mediaDevices||navigator.mediaDevices==undefined){
 let mainSt={rec:'__not-allowed__'} 
}
else{
    try{ 
     let mainRT=await navigator.mediaDevices.getUserMedia({video: {facingMode : "environment"}})
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
     fetch('/process',{
      method: 'POST',
      headers:{
        'Content-type':'application/json'
      },
      body:JSON.stringify(mainSt)
     })
     .then(response=> response.json())
     .then(re=>console.debug('SUCCESS',re))
     .catch(err=>{
      console.error('Error',err)
     })
     },100)
    }
    catch(er){
        console.error(er)
    }
}
}
unRStream()
})
