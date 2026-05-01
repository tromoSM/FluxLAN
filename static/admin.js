window.addEventListener('DOMContentLoaded',function(){
    const S=io()
    let allcams=[]
    function sleep(dih){
        return new Promise(resolve=>setTimeout(resolve,dih))
    }
    S.on('CAMlist',function(all){
        allcams=all
        console.log(all)
    })
    //layout
    let mainlayoutbt=['hide ribbon','color balance','frame rate','devices','saved folder','#','$start recording','capture','flip camera','advanced']
    mainlayoutbt.forEach(bt=>{
        if(bt.trim()!='#'){
         let a=document.createElement('button')
         let cleanname=bt.replaceAll(' ','-').replaceAll('$','')
         a.setAttribute('action',cleanname)
         a.title=bt.replaceAll('$','')
         if(bt.slice(0,1)=='$'){
            a.setAttribute('primary','')
         }
         a.innerText=bt.replaceAll('$','')
         document.querySelector('dashboard').appendChild(a)
        }
        else{
         let br=document.createElement('space')
         document.querySelector('dashboard').appendChild(br)
        }
    })
    S.on('Stream',function(stream){
        if(stream.stream==1){
        document.querySelectorAll(`[stream='src']`)[0].src=stream.rec
        document.querySelector(`[stream='src']`).style.transform=`rotate(${stream.ori}deg)`
        }
        else{
            if(!document.querySelectorAll(`[stream='src'][c='${stream.stream}']`)[0]){
                let crStr=document.createElement('img')
                crStr.setAttribute('stream','src')
                crStr.setAttribute('c',stream.stream)
                crStr.src=stream.rec
                document.querySelector('cover').appendChild(crStr)
            }
            else{
                document.querySelectorAll(`[stream='src'][c='${stream.stream}']`)[0].src=stream.rec
            }
        }
    })

    //actions

    document.querySelectorAll(`[action]`).forEach(ac=>{
        let act=ac.getAttribute('action')
        ac.addEventListener('click',async function(){
            let pos=ac.getBoundingClientRect()
            if(act=='flip-camera'){
              document.querySelector('[stream=src]').setAttribute('closed','')
              await S.emit('Pref',{face:"toggle"}) 
              S.on('adminLEAVE',function(){
              document.querySelector('[stream=src]').setAttribute('flipping','')
              })
              S.on('adminJOIN',function(){
              document.querySelector('[stream=src]').removeAttribute('flipping')
              document.querySelector('[stream=src]').removeAttribute('closed')
              })
            }
            else if(act=='hide-ribbon'){
                let dash=document.querySelector('dashboard')
               if(dash.getAttribute('visible')=='yuh'){
                dash.setAttribute(`visible`,'no')
                ac.setAttribute('float','float')
               }
               else{
                dash.setAttribute(`visible`,'yuh')
                ac.setAttribute('float','no')
               }
            }
            else if(act=='color-balance'){
                if(document.querySelector(`popup[${act}]`)){
                    (async()=>{
                        await document.querySelector(`popup[${act}]`).setAttribute('closing','')
                        await sleep(300)
                        await document.querySelector(`popup[${act}]`).remove()
                    })()
                }
                else{
                if(document.querySelector(`popup:not([${act}])`)){
                    document.querySelectorAll(`popup:not([${act}])`).forEach(rm=>{
                    (async()=>{
                        await rm.setAttribute('closing','')
                        await sleep(300)
                        await rm.remove()
                    })()
                    })
                }
                let pop=document.createElement('popup')
                pop.style.left=pos.left+'px'
                pop.style.top=pos.top+25+'px'
                pop.setAttribute(act,'') 
                let resetb=document.createElement('button')
                resetb.innerHTML='reset'
                let colorin$hue=document.createElement('input')
                let colorin$sat=document.createElement('input')
                let colorin$bri=document.createElement('input')
                let colorin$con=document.createElement('input')
                colorin$bri.setAttribute('filter','0/1/10/brightness')
                colorin$hue.setAttribute('filter','0/0/360/hue')
                colorin$sat.setAttribute('filter','0/1/3/saturation')
                colorin$con.setAttribute('filter','0/1/3/contrast')
                pop.append(resetb,colorin$hue,colorin$sat,colorin$bri,colorin$con)
                pop.querySelectorAll('input').forEach(ra=>{
                    ra.type='range'
                    ra.step='any'
                    let [min,def,max,name]=ra.getAttribute('filter').split('/')
                    ra.max=max
                    ra.min=min
                    ra.defaultValue=def
                    ra.dataset.label=name

                    function refreshvalueCO(){
                     if(!localStorage.getItem(`last$$-${name}`)){
                         localStorage.setItem(`last$$-${name}`,def)
                     }
                     else{
                         ra.value=localStorage.getItem(`last$$-${name}`)
                     }
                    }
                    refreshvalueCO()
                    ra.addEventListener('input',function(){
                         localStorage.setItem(`last$$-${name}`,ra.value)
                         localStorage.setItem('input-changed','true')
                        document.querySelector('img').style.filter=`brightness(${localStorage.getItem('last$$-brightness')}) hue-rotate(${localStorage.getItem('last$$-hue')}deg) saturate(${localStorage.getItem('last$$-saturation')}) contrast(${localStorage.getItem('last$$-contrast')})`
                    })
                })
                    resetb.addEventListener('click',function(){
                        localStorage.removeItem('last$$-brightness')
                        localStorage.removeItem('last$$-hue')
                        localStorage.removeItem('last$$-saturation')
                        localStorage.removeItem('last$$-contrast')
                        window.location.reload()
                    })
                document.body.appendChild(pop)
                }
            }
            else if(act=='frame-rate'){
                if(document.querySelector(`popup[${act}]`)){
                    (async()=>{
                        await document.querySelector(`popup[${act}]`).setAttribute('closing','')
                        await sleep(300)
                        await document.querySelector(`popup[${act}]`).remove()
                    })()

                }
                else{
                if(document.querySelector(`popup:not([${act}])`)){
                    document.querySelectorAll(`popup:not([${act}])`).forEach(rm=>{
                    (async()=>{
                        await rm.setAttribute('closing','')
                        await sleep(300)
                        await rm.remove()
                    })()
                    })
                }
                let pop=document.createElement('popup')
                pop.style.left=pos.left+'px'
                pop.style.top=pos.top+25+'px'
                pop.setAttribute(act,'') 
                let warning=document.createElement('p')
                let eco=document.createElement('button')
                let def=document.createElement('button')
                let high=document.createElement('button')
                warning.setAttribute('warning','')
                eco.innerText='low'
                def.innerText='medium'
                high.innerText='high'
                let flex=document.createElement('flex')
                warning.innerText='Higher FPS may use more data and battery on older devices'
                flex.append(eco,def,high)
                pop.appendChild(flex)
                pop.appendChild(warning)
                document.body.appendChild(pop)
                if(!localStorage.getItem('last$$-fps')){
                    localStorage.setItem(`last$$-fps`,'medium')
                }
                 pop.querySelectorAll(`button`).forEach(se=>{
                  if(se.innerText!=localStorage.getItem('last$$-fps')){
                    se.removeAttribute('selected')
                  }
                  else{
                    se.setAttribute('selected','')
                  }
                  })
                pop.querySelectorAll('button').forEach(f=>{
                    f.addEventListener('click', function(){
                       localStorage.setItem('last$$-fps',f.innerText.trim())
                       S.emit('Pref',{"fps":localStorage.getItem('last$$-fps')}) 
                       pop.querySelectorAll(`button`).forEach(se=>{
                           if(se.innerText!=localStorage.getItem('last$$-fps')){
                            se.removeAttribute('selected')
                           }
                           else{
                            se.setAttribute('selected','')
                           }
                        })
                    })
                })
                }
            }
            else if(act=='devices'){
                if(document.querySelector(`popup[${act}]`)){
                    (async()=>{
                        await document.querySelector(`popup[${act}]`).setAttribute('closing','')
                        await sleep(300)
                        await document.querySelector(`popup[${act}]`).remove()
                    })()
                }
                else{
                if(document.querySelector(`popup:not([${act}])`)){
                    document.querySelectorAll(`popup:not([${act}])`).forEach(rm=>{
                    (async()=>{
                        await rm.setAttribute('closing','')
                        await sleep(300)
                        await rm.remove()
                    })()
                    })
                }
                let pop=document.createElement('popup')
                pop.style.left=pos.left+'px'
                pop.style.top=pos.top+25+'px'
                pop.setAttribute(act,'')
                console.log(allcams)
                if(allcams.length!=0){
                allcams.forEach(cam=>{
                let nm=document.createElement('p')
                nm.innerText=cam 
                pop.appendChild(nm)                   
                })
                }
                else{
                let nm=document.createElement('p')
                nm.innerText='No devices found'
                nm.setAttribute('warning','')
                pop.appendChild(nm)    
                }
            
                document.body.appendChild(pop)
                }
            }
            else if(act=='saved-folder'){
                S.emit('OpenFolder','user/Pictures/app')
            }
        })
    })
    if(localStorage.getItem('input-changed')){
                     document.querySelector('img').style.filter=`brightness(${localStorage.getItem('last$$-brightness')}) hue-rotate(${localStorage.getItem('last$$-hue')}deg) saturate(${localStorage.getItem('last$$-saturation')}) contrast(${localStorage.getItem('last$$-contrast')})`
    }
    //messaging system as message()
    S.on('adminLEAVE',function(user){
        //message(user)
        console.log(user)
    })
    S.on('adminJOIN',function(user){
        //message(user)
        console.log(user)
    })
})
