window.addEventListener('DOMContentLoaded',function(){
    const S=io()
    let allcams=[]
    function sleep(dih){
        return new Promise(resolve=>setTimeout(resolve,dih))
    }
    S.on('CAMlist',function(all){
        allcams=all
    })
    window.openS=function(path){
        S.emit('OpenSelected',path)
    }
    window.openDir=function(path){
        S.emit('OpenDir',path)
    }
    function cammessage(a){
        let full=document.createElement('f')
        let war=document.createElement('p')
        war.setAttribute('cammsg','')
        war.innerText='No devices detected'
        full.appendChild(war)
        if(a=='show'){
         if(!document.querySelector('[cammsg]')){
            document.body.appendChild(full)
         }
        }
        else if(a=='hide'){
            if(document.querySelector('[cammsg]')){
             document.querySelectorAll('f').forEach(f=>{f.remove()})
            }
        }
    }
    async function notification({level='__info__',title='',body='',icon='__none__',timeout=4}={}){
        let notification=document.createElement('notification')
        notification.setAttribute('level',level)
        let titlea=document.createElement('h3')
        titlea.innerText=title
        let desc=document.createElement('p')
        desc.innerHTML=body //dont change to innertext add el act
        if(icon!='__none__'){
            let imimicon=document.createElement('img')
            imimicon.src=icon
            notification.appendChild(imimicon)
        }
        let flexC=document.createElement('flexCol')
        flexC.appendChild(titlea)
        flexC.appendChild(desc)
        notification.appendChild(flexC)
        await sleep(200)
        document.body.appendChild(notification)
        if(timeout!='never'){
        await sleep(parseInt(timeout*1000))
        notification.setAttribute('closing','')
        await sleep(300)
        notification.remove()

        }

    }
    S.on('AdminNotification',function(data){
        notification({title:data.title,body:data.body,icon:data.icon,level:data.level,timeout:data.timeout})
    })
    function saveimg(){
        if(allcams.length!=0){
                   document.querySelectorAll('[stream]').forEach(str=>{
                    let maincanv=document.createElement('canvas')
                    let cavget=maincanv.getContext('2d')
                    maincanv.width=str.naturalWidth
                    maincanv.height=str.naturalHeight
                    if(localStorage.getItem('input-changed')){
                         cavget.filter=`brightness(${localStorage.getItem('last$$-brightness')}) hue-rotate(${localStorage.getItem('last$$-hue')}deg) saturate(${localStorage.getItem('last$$-saturation')}) contrast(${localStorage.getItem('last$$-contrast')})`
                    }
                    else{
                      cavget.filter='brightness(1)'
                    }
                    cavget.drawImage(str,0,0,maincanv.width,maincanv.height)
                    S.emit('SaveImage',maincanv.toDataURL('image/jpeg'),path=>{
                        notification({title:"Image saved",body:`Image saved to <span onclick="openDir('${path.dir}')" >${path.dir}/</span><span button='open' onclick="openS('${path.file}')">Open</span>`,timeout:3})
                    })
                    maincanv.toDataURL('image/jpeg')
                    })
                }
        else{
                notification({title:'No device connected',body:'Cannot take picture : 0 devices are connected to fluxLAN',timeout:5,level:'error'})
            }
    }
    //first time
    if(!localStorage.getItem('tutorial')){
        let full=document.createElement('full')
        
    }
    //layout
    let mainlayoutbt=['hide ribbon|keyboard_arrow_up','color balance|format_paint','frame rate|motion_mode','devices|mobile_camera','1saved folder|folder','#','$1start recording|play_arrow','1capture|photo_camera','1flip camera|flip_camera_ios','advanced|settings']
    let flx=document.createElement('flexR')
    mainlayoutbt.forEach(bt=>{
        if(bt.trim()!='#'){
         let a=document.createElement('button')
         let cleanname=bt.replaceAll(' ','-').replaceAll('$','').split('|')[0].replaceAll('1','')
         a.setAttribute('action',cleanname)
         if(bt.slice(0,1)=='$'){
            a.setAttribute('primary','')
         }
         if(bt.includes('1')){
            a.setAttribute('filled','')
         }
         if(bt.includes('|')){
            let ic=document.createElement('span')
            ic.className='material-symbols-rounded'
            ic.innerText=`${bt.split('|')[1].toUpperCase()}`
            a.appendChild(ic)
         }
         a.setAttribute('tooltip',bt.replaceAll('$','').split('|')[0].replaceAll('1',''))
         flx.appendChild(a)
        }
        else{
         let br=document.createElement('space')
         flx.appendChild(br)
        }
    })
    document.querySelector('dashboard').appendChild(flx)

    S.on('Stream',function(stream){
        cammessage('hide')
        if(stream.stream==0){
        document.querySelectorAll(`[stream='src']`)[0].src=stream.rec
        document.querySelectorAll(`[stream='src']`)[0].setAttribute('from',stream.camname)
        document.querySelector(`[stream='src']`).style.transform=`rotate(${stream.ori}deg)` //change this to pref()
        }
        else{
            if(!document.querySelectorAll(`[stream='src'][c='${stream.stream}']`)[0]){
                let crStr=document.createElement('img')
                crStr.setAttribute('stream','src')
                crStr.setAttribute('c',stream.stream)
                crStr.src=stream.rec
                crStr.setAttribute('from',stream.camname)
                let rel=document.createElement('relborder')
                let strpanel=document.createElement('hvpanel')
                let battery=document.createElement('span')
                battery.setAttribute('battery','')
                battery.className='material-symbols-rounded'
                strpanel.appendChild(battery)
                rel.append(crStr,strpanel)
                document.querySelector('cover').appendChild(rel)
            }
            else{
                document.querySelectorAll(`[stream='src'][c='${stream.stream}']`)[0].src=stream.rec
                document.querySelectorAll(`[stream='src'][c='${stream.stream}']`)[0].setAttribute('from',stream.camname)
            }
        }
    })

    //actions

    document.querySelectorAll(`[action]`).forEach(ac=>{
        let act=ac.getAttribute('action')
        ac.addEventListener('click',async function(){
            let pos=ac.getBoundingClientRect()
            if(act=='flip-camera'){
             if(allcams.length!==0){
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
             else{
                notification({title:'No device connected',body:'Cannot flip camera : 0 devices are connected to fluxLAN',timeout:5,level:'error'})
             }
            }
            else if(act=='hide-ribbon'){
                let dash=document.querySelector('dashboard')
               if(dash.getAttribute('visible')=='yuh'){
                ac.querySelector('span').innerText='keyboard_arrow_down'
                dash.setAttribute(`visible`,'no')
                ac.setAttribute('float','float')
                if(document.querySelector('popup')){
                    document.querySelector('popup').setAttribute('closing','')
                    await sleep(300)
                    document.querySelector('popup').remove()
                }
               }
               else{
                ac.querySelector('span').innerText='keyboard_arrow_up'
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
                pop.style.top=pos.top+41+'px'
                pop.setAttribute(act,'') 
                let resetb=document.createElement('button')
                resetb.innerHTML='reset'
                let name=document.createElement('p')
                name.innerText=act.replaceAll('-',' ')
                name.setAttribute('io','')
                pop.appendChild(name)
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
                         document.querySelectorAll('img').forEach(cam=>{
                          cam.style.filter=`brightness(${localStorage.getItem('last$$-brightness')}) hue-rotate(${localStorage.getItem('last$$-hue')}deg) saturate(${localStorage.getItem('last$$-saturation')}) contrast(${localStorage.getItem('last$$-contrast')})`
                         })
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
                pop.style.top=pos.top+41+'px'
                pop.setAttribute(act,'') 
                let name=document.createElement('p')
                name.innerText=act.replaceAll('-',' ')
                name.setAttribute('io','')
                pop.appendChild(name)
                let warning=document.createElement('p')
                let eco=document.createElement('button')
                let def=document.createElement('button')
                let high=document.createElement('button')
                warning.setAttribute('warning','')
                eco.innerText='low'
                def.innerText='medium'
                high.innerText='high'
                let flex=document.createElement('flex')
                warning.innerText='Higher FPS may use more battery and might lag on older devices'
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
                pop.style.top=pos.top+41+'px'
                pop.setAttribute(act,'')
                let name=document.createElement('p')
                name.innerText=act.replaceAll('-',' ')
                name.setAttribute('io','')
                pop.appendChild(name)
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

            else if(act=='capture'){

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
                pop.style.top=pos.top+41+'px'
                pop.setAttribute(act,'')
                let name=document.createElement('p')
                name.innerText=act.replaceAll('-',' ')
                name.setAttribute('io','')
                pop.appendChild(name)
                let now=document.createElement('button')
                now.innerHTML='<span class="material-symbols-rounded">photo_camera</span> take now'
                let time=document.createElement('p')
                time.setAttribute('warning','')
                function refreshtime(){
                time.innerText=`current time : ${new Date().toLocaleDateString("default",{hour:'2-digit',minute:'2-digit'})}`
                }
                refreshtime()
                setInterval(refreshtime,500)
                let des=document.createElement('p')
                des.setAttribute('warning','')
                des.innerText=`or capture 5 minutes from now`
                let mainin=document.createElement('input')
                let up=document.createElement('button')
                up.innerText='+'
                let down=document.createElement('button')
                down.innerText='-'
                let flexRR=document.createElement('FlexRR')
                let exc=document.createElement('button')
                let pred=document.createElement('p')
                pred.setAttribute('warning','')
                exc.innerText='✓'
                mainin.type='number'
                mainin.max='1440'
                mainin.min='0'
                mainin.defaultValue='5'
                function refreshval(){
                    if (mainin.value.trim()==''|| isNaN(mainin.value) || mainin.value.includes('-')){
                      des.innerText=`or capture x minutes from now`
                    }
                    else{
                      des.innerText=`or capture ${parseInt(mainin.value)} minutes from now`
                      pred.innerText=`The capture will be taken at ${new Date(Date.now()+(parseInt(mainin.value)*60*1000)).toLocaleTimeString()}`
                    }
                    if(mainin.value<=1){
                        down.setAttribute('disabled','')
                    }
                    else{
                        down.removeAttribute('disabled')
                    }
                }
                mainin.addEventListener('input',refreshval)
                up.addEventListener('click',function(){
                    mainin.value++
                    refreshval()
                })
                down.addEventListener('click',function(){
                    mainin.value--
                    refreshval()
                })
                exc.addEventListener('click',function(){
                    ac.setAttribute('due','')
                    setTimeout(()=>{
                        ac.removeAttribute('due')
                        saveimg()
                    },(parseInt(mainin.value)*60*1000))
                    console.log('Capture event was executed')
                })
                flexRR.append(mainin,up,down,exc)
                pop.append(now,des,flexRR,pred,time)
                document.body.append(pop)
                now.addEventListener('click',saveimg)
            }
            }
            else if(act=='start-recording'){
                if(allcams.length!=0){
                    let recstate
                    S.emit('INFO','ifRecRunning',(st)=>{
                        recstate=st.running
                        console.log(recstate)
                        if(recstate=='False'){
                            S.emit('Record',{command:"start",stream:0})
                            ac.querySelector('span').innerText='stop'
                            //add notification
                         }
                         else{
                            S.emit('Record',{command:"stop",stream:0})
                            ac.querySelector('span').innerText='play_arrow'
                        }
                    })
                }
                else{
                notification({title:'No device connected',body:'Cannot start recording : 0 devices are connected to fluxLAN',timeout:5,level:'error'})
                }
            }
        })
    })
    if(localStorage.getItem('input-changed')){
                     document.querySelectorAll('img').forEach(cam=>{
                         cam.style.filter=`brightness(${localStorage.getItem('last$$-brightness')}) hue-rotate(${localStorage.getItem('last$$-hue')}deg) saturate(${localStorage.getItem('last$$-saturation')}) contrast(${localStorage.getItem('last$$-contrast')})`
                     })
    }
    //messaging system as message()
    S.on('adminLEAVE',function(user){
        notification({title:`${user} left`,body:`${user} has left fluxLAN.`,icon:'static/Assets/favicon.png',timeout:2})
        console.log(user)
        document.querySelectorAll(`[stream='src'][from='${user}']`).forEach(all=>{
            if(all.getAttribute('c')!=='0'){
                all.remove()
            }
            else{
                all.setAttribute('empty','')
            }
        })
        if(allcams.length==0){
            cammessage('show')
        }
    })
    S.on('adminJOIN',function(user){
        //message(user)
        notification({title:`${user} joined`,body:`${user} joined.`,icon:'static/Assets/favicon.png',timeout:3})
        cammessage('hide')
    })
    document.querySelectorAll(`[stream='src']`)[0].addEventListener('load',function(){
        document.querySelectorAll(`[stream='src']`)[0].removeAttribute('empty')
        if(allcams.length==0){
            cammessage('show')
        }
    })
    document.querySelectorAll(`[stream='src']`)[0].addEventListener('error',function(){
        document.querySelectorAll(`[stream='src']`)[0].setAttribute('empty','')
        cammessage('show')
    })
    function refreshTooltip(){
        
    document.querySelectorAll('[tooltip]').forEach(yo=>{
        yo.addEventListener('mouseenter',function(){
            let pos=yo.getBoundingClientRect()
            let title=document.createElement('tooltip')
            title.innerText=yo.getAttribute('tooltip')
            title.style.left=pos.left+'px'
            title.style.top=pos.top+pos.height+'px'
            document.body.appendChild(title)
        })
        yo.addEventListener('mouseleave',async function(){
        document.querySelectorAll('tooltip').forEach(async y=>{
            y.setAttribute('closing','')
            await sleep(200)
            y.remove()
        })
    })
    })
    }
    refreshTooltip()
    S.on('adminBatteryChange',function(data){
        console.log(`user ${data.user} is at ${data.status}%`) 
        let battery=document.querySelector(`[stream][from="${data.user}"]`).closest('relborder').querySelector('hvpanel').querySelector('span[battery]')
        if(battery){
        if(data.status!=='__not-supported__'){
            let lev=Math.min(7,Math.max(1,Math.ceil(parseInt(data.status)/100*7)))
            battery.innerText=`battery_android_frame_${lev}`
            battery.setAttribute('tooltip',`${data.status}%`)
        }
        else{
            battery.innerText='battery_android_frame_question'
            battery.setAttribute('tooltip','this device doesnt support this feature')
        }
        refreshTooltip()
       }
    })
})
