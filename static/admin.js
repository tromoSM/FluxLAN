function sleep(dih){
        return new Promise(resolve=>setTimeout(resolve,dih))
}

window.addEventListener('DOMContentLoaded',function(){
    const S=io()
    dynamiclink=new URLSearchParams(window.location.search)
    let allcams=[]

     lottie.loadAnimation({
            container:document.querySelector('loading'),
            renderer:"svg",
            loop:true,
            autoplay:true,
            path:"/static/Assets/loader.json"
     })
     let startup=performance.now()
    S.on('CAMlist',function(all){
        allcams=all
    })
    window.openS=function(path,folder,filet){
        S.emit('OpenSelected',{"file":path,"folder":folder,'filetype':filet})
    }
    window.openDir=function(path){
        S.emit('OpenDir',path)
    }
    let UPDATECHKROOT=''
    let LINKLOOKUP=''
    let LOCALIP='127.0.0.1'
    let port='unavailable'
    let protocol='unavailable'
    let strength='unavailable'
    S.emit('INFO','about',(app)=>{
        window.FluxLAN_version=app.version
        window.FluxLAN_version_release=app.version_release
        window.FluxLAN_release_date=app.date
        window.FluxLAN_build=app.build
        UPDATECHKROOT=app.updatechk_root
        LINKLOOKUP=app.link_lookup
        LOCALIP=app.ip
        port=app.port
        protocol=app.protocol
        strength=app.strength
        window.FluxLAN_release_type=app.release_type
    })
    let fromcammessage=false
    function cammessage(a){
        let full=document.createElement('f')
        full.setAttribute('nonrec','')
        let war=document.createElement('p')
        war.setAttribute('cammsg','')
        war.innerText='No devices detected'
        let link=document.createElement('button')
        link.innerText='Link device'
        link.setAttribute('nonusrpageinner','')
        link.addEventListener('click',function(s){
            fromcammessage=true
            s.stopPropagation()
            if(document.querySelector('[action="link-camera"]')){
                document.querySelector('[action="link-camera"]').click()
            }
        })
        let camcon=document.createElement('p')
        camcon.innerHTML='<span camicon class="material-symbols-rounded">devices</span>'
        full.append(camcon,war,link)
        if(a=='show'){
         if(!document.querySelector('[cammsg]')){
            document.body.appendChild(full)
         }
        }
        else if(a=='hide'){
            if(document.querySelector('[cammsg]')){
             document.querySelectorAll('[nonrec]').forEach(f=>{f.remove()})
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
    function refreshLinks(){
        //add mutationobserver for standalone
        document.querySelectorAll('[openlink]').forEach(yo=>{
            if(yo.getAttribute('openlink-indexed')){
                return
            }
            yo.setAttribute('openlink-indexed','true')
            yo.addEventListener('click',function(){
                let temphref=document.createElement('a')
                temphref.href=yo.getAttribute('openlink')
                if(yo.hasAttribute('target')){
                    temphref.target=yo.getAttribute('target')
                    if(yo.getAttribute('target')=='_blank'){
                        temphref.rel='noreferrer'
                    }
                }
                temphref.style.display='none'
                document.body.appendChild(temphref)
                temphref.click()
            })
            if(!yo.hasAttribute('removeIndicator')){
                let temp=document.createElement('linkindicator')
                if(yo.hasAttribute('indicatorText')){
                temp.innerText=yo.getAttribute('indicatorText')
                }
                else{temp.innerText=yo.getAttribute('openlink')}
                yo.addEventListener('mouseenter',async function(){
                if(temp.hasAttribute('closing')){
                        temp.removeAttribute('closing')
                }
                document.body.appendChild(temp)

                })
                yo.addEventListener('mouseleave',async function(){
                    temp.setAttribute('closing','')
                    await sleep(300)
                    temp.remove()
                })
            }
        })
    }
    function refreshdragels(){
        document.querySelectorAll('relborder').forEach(rel=>{
            if(rel.hasAttribute('dragindexed')){
                return
            }
            let savedmove=localStorage.getItem(`moved-${rel.querySelector('[stream]').getAttribute('c')}`)
            if(savedmove){
                rel.style.transform=`translate(${savedmove.split('$')[0]}px,${savedmove.split('$')[1]}px)`
            }
            let savedsize=localStorage.getItem(`size-${rel.querySelector('[stream]').getAttribute('c')}`)
            if(savedsize){
                rel.style.width=savedsize.split('$')[0]+'px'
                rel.style.height=savedsize.split('$')[1]+'px'
            }
             rel.setAttribute('dragindexed','')
             let x=0
             let y=0
             let startx,starty
             rel.addEventListener('pointerdown',function(ev){
                startx=ev.clientX-x
                let clickloc=rel.getBoundingClientRect()
                if(ev.clientX>clickloc.right-25&&ev.clientY>clickloc.bottom-25){
                localStorage.setItem(`size-${rel.querySelector('[stream]').getAttribute('c')}`,`${clickloc.width}$${clickloc.height}`)
                console.log(`size-${rel.querySelector('[stream]').getAttribute('c')}`,`${clickloc.width}$${clickloc.height}`)
                return}
                starty=ev.clientY-y
                function move(ev){
                    x=ev.clientX-startx
                    y=ev.clientY-starty
                    rel.style.transform=`translate(${x}px,${y}px)`
                    localStorage.setItem(`moved-${rel.querySelector('[stream]').getAttribute('c')}`,`${x}$${y}`)
                }
                function rmev(){
                    document.removeEventListener('pointermove',move)
                    document.removeEventListener('pointerup',rmev)
                }
                document.addEventListener('pointermove',move)
                document.addEventListener('pointerup',rmev)
             })
        })
    }
    refreshdragels()
    S.on('AdminNotification',function(data){
        notification({title:data.title,body:data.body,icon:data.icon,level:data.level,timeout:data.timeout})
    })
    function saveimg(){
        if(allcams.length!=0){
                   document.querySelectorAll('[stream]').forEach(async str=>{
                    str.closest('relborder').setAttribute('capturing','')
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
                        notification({title:"Image saved",body:`Image saved to <span onclick="openDir('${path.dir}')" >${path.dir}/</span><span button='open' onclick="openS('${path.file}','Captures','jpg')">Open</span>`,timeout:3})
                    })
                    maincanv.toDataURL('image/jpeg')
                    await sleep(200)
                    str.closest('relborder').removeAttribute('capturing')
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
    if(!localStorage.getItem('recording')){
                    localStorage.setItem('recording','yes')
    }
    //layout
    let mainlayoutbt=['hide ribbon|keyboard_arrow_up','color balance|format_paint','frame rate|motion_mode','devices|mobile_camera','1saved folder|folder','#','$1start recording|play_arrow','1capture|photo_camera','1flip camera|flip_camera_ios',"motion detector|motion_sensor_active",'link camera|qr_code_2','advanced|info']
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
         if(cleanname=='color-balance'||cleanname=='devices'||cleanname=='advanced'){
            a.setAttribute('tab','')
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
    if(localStorage.getItem('recording')=='yes'){
        // dont remove update before click
        if(document.querySelector('[action="start-recording"').querySelector('span')){
            document.querySelector('[action="start-recording"').querySelector('span').innerText='stop'
        }
    }
    startupfinish=performance.now();
    (async()=>{
      if(startupfinish-startup>1000){
        document.querySelector('loading').setAttribute('closing','')
        document.querySelector('webview-loading')?.setAttribute('closing','')
        await sleep(300)
        document.querySelector('loading').remove()
        document.querySelector('webview-loading')?.remove()
      }
      else{
        await sleep(1000-(startupfinish-startup))
        document.querySelector('webview-loading')?.setAttribute('closing','')
        document.querySelector('loading').setAttribute('closing','')
        await sleep(300)
        document.querySelector('webview-loading')?.remove()
        document.querySelector('loading').remove()
      }
      console.log(`Dashboard startup took : ${(startupfinish-startup)/1000}s`)
    })()

    let stream1info=['0','0']
    S.on('Stream',function(stream){
    refreshdragels()
        cammessage('hide')
            if(!document.querySelectorAll(`[stream='src'][from='${stream.camname}']`)[0]){
                let crStr=document.createElement('img')
                crStr.setAttribute('stream','src')
                crStr.setAttribute('c',stream.stream)
                crStr.src=stream.rec
                crStr.setAttribute('from',stream.camname)
                let rel=document.createElement('relborder')
                rel.width=crStr.naturalWidth
                rel.height=crStr.naturalHeight
                let strpanel=document.createElement('hvpanel')
                let battery=document.createElement('span')
                battery.setAttribute('battery','')
                battery.className='material-symbols-rounded'
                //let nametag=document.createElement('p')
                //nametag.setAttribute('nametag','')
                //nametag.innerText=stream.camname
                strpanel.append(battery)
                rel.append(crStr,strpanel)
                document.querySelector('cover').appendChild(rel)
            }
            else{
                let stream1=document.querySelectorAll(`[stream='src'][from="${stream.camname}"]`)[0]
                stream1.src=stream.rec
                stream1.setAttribute('from',stream.camname)
                if(stream1.naturalWidth!=stream1info[0]||stream1.naturalHeight!=stream1info[1]){
                    stream1.closest('relborder').width=stream1.naturalWidth
                    stream1.closest('relborder').height=stream1.naturalHeight
                    console.log('stream 1 dimensions changed')
                    stream1info=[stream1.naturalWidth,stream1.naturalHeight]
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
                ac.setAttribute('tooltip','show ribbon')
                dash.setAttribute(`visible`,'no')
                ac.setAttribute('float','float')
                document.querySelectorAll('relborder').forEach(stream=>{
                    stream.style.height=`calc(${window.getComputedStyle(stream).height} + 52px)`
                    let currenttra=(localStorage.getItem("moved-"+stream.querySelector('[stream]').getAttribute('c'))).split('$')
                    stream.style.transform=`translate(${currenttra[0]}px,${currenttra[1]-52}px)`
                })
                if(document.querySelector('popup')){
                    document.querySelector('popup').setAttribute('closing','')
                    await sleep(300)
                    document.querySelector('popup').remove()
                }
               }
               else{
                ac.querySelector('span').innerText='keyboard_arrow_up'
                dash.setAttribute(`visible`,'yuh')
                ac.setAttribute('tooltip','hide ribbon')
                ac.setAttribute('float','no')
                document.querySelectorAll('relborder').forEach(stream=>{
                    stream.style.height=`calc(${window.getComputedStyle(stream).height} - 52px)`
                    let currenttra=(localStorage.getItem("moved-"+stream.querySelector('[stream]').getAttribute('c'))).split('$')
                    stream.style.transform=`translate(${currenttra[0]}px,${currenttra[1]}px)`
                })
               }
            }
            else if(act=='color-balance'){
                if(document.querySelector(`popup[${act}]`)){
                    (async()=>{
                        await document.querySelector(`popup[${act}]`).setAttribute('closing','')
                        await sleep(300)
                        await document.querySelector(`popup[${act}]`).remove()
                    })()
                ac.setAttribute('tab','')
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
                ac.setAttribute('tab','open')
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
                    ac.setAttribute('tab','')
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
                ac.setAttribute('tab','open')
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
                let warning=document.createElement('p')
                warning.setAttribute('warning','')
                warning.innerText='Fluxlan is processing video in memory(ram) while recording. Long recordings may affect performance or fail on low memory systems'
                pop.append(name,warning)
                let start=document.createElement('button')
                start.setAttribute('start','')
                let ico=document.createElement('span')
                ico.className='material-symbols-rounded'
                function updateStatus(){
                if(localStorage.getItem('recording')=='yes'){
                 start.innerText='Stop recording '
                 ico.innerText='stop'
                 ac.querySelector('span').innerText='stop'
                 ac.setAttribute('tooltip','stop recording')
                }
                else{
                 start.innerText='Start recording'
                 ico.innerText='play_arrow'
                 ac.querySelector('span').innerText='play_arrow'
                 ac.setAttribute('tooltip','start recording')
                }
                start.append(ico)
                }
                updateStatus()
                if(allcams.length!=0){
                 allcams.forEach(cam=>{
                    let button=document.createElement('button')
                    button.innerText=cam
                    button.setAttribute('camindex',document.querySelector(`[stream="src"][from="${cam}"]`).getAttribute('c'))
                    button.setAttribute('selectable','cam')
                    pop.appendChild(button)
                 })
                }
                else{
                 start.setAttribute('disabled','')
                }
                pop.append(start)
                document.body.append(pop)   
                if(!localStorage.getItem('last$$stream')){
                    localStorage.setItem('last$$stream',pop.querySelectorAll('button[selectable="cam"]')[0].getAttribute('camindex'))
                }
                function refreshStream(){
                document.querySelectorAll('button[selectable="cam"]').forEach(bt=>{
                 if(bt.getAttribute('camindex')!=localStorage.getItem('last$$stream')){
                    bt.removeAttribute('selected')
                 }
                 else{
                    bt.setAttribute('selected','')
                 }
                })
                }
                refreshStream(.3)
                pop.querySelectorAll('button[selectable="cam"]').forEach(bt=>{
                    bt.addEventListener('click',function(){
                       localStorage.setItem('last$$stream',bt.getAttribute('camindex'))
                       refreshStream()
                    })
                })
                //add
                start.addEventListener('click',function(){
                if(allcams.length!=0){
                    let recstate
                    S.emit('INFO','ifRecRunning',(st)=>{
                        recstate=st.running
                        if(recstate=='False'){
                            S.emit('Record',{command:"start",stream:localStorage.getItem('last$$stream')})
                            //add notification
                            localStorage.setItem('recording','yes')
                         }
                         else{
                            S.emit('Record',{command:"stop",stream:localStorage.getItem('last$$stream')})
                            localStorage.setItem('recording','no')
                        }
                updateStatus()
                    })
                }
                else{
                notification({title:'No device connected',body:'Cannot start recording : 0 devices are connected to fluxLAN',timeout:5,level:'error'})
                }
                })

            }
            }
            else if(act=='motion-detector'){
                if(allcams.length==0){
                notification({title:'No device connected',body:'Cannot start motion detector : 0 devices are connected to fluxLAN',timeout:5,level:'error'})
                    return
                }
                if(!localStorage.getItem('motion-detecting')){
                    localStorage.setItem('motion-detecting','no')
                }
                if(localStorage.getItem('motion-detecting')=='no'){
                    ac.setAttribute('due','')
                    S.emit('MotionDetection',{command:'start'})
                    localStorage.setItem('motion-detecting','yes')
                }
                else{
                    ac.removeAttribute('due')
                    S.emit('MotionDetection',{command:'stop'})
                    localStorage.setItem('motion-detecting','no')
                }
            }
            else if(act=='link-camera'){
                if(document.querySelector(`flpop[${act}]`)){
                    document.querySelectorAll(`flpop[${act}]`).forEach(async pop=>{
                        pop.setAttribute('closing','')
                        await sleep(200)
                        pop.closest('f').remove()
                    })
                }
                else{
                 S.emit('INFO','qr',async (qr)=>{
                   let full=document.createElement('f')
                   let infull=document.createElement('flpop')
                   infull.setAttribute(act,'')
                   infull.setAttribute('closing','')
                   im=document.createElement('img')
                   infull.setAttribute('flexR','')
                   im.src=`data:image/png;base64,${qr.qr}`
                   im.setAttribute('qr','')
                   im.setAttribute('openlink',qr.link)
                   im.setAttribute('indicatortext',qr.link)
                   im.setAttribute('target','_blank')
                   im.setAttribute('tooltip','open in new tab')
                   let flexc=document.createElement('flexC')
                   let title=document.createElement('h2')
                   title.innerText='Scan QR to link device'
                   let desc=document.createElement('p')
                   let sidetitle=document.createElement('p')
                   sidetitle.setAttribute('warning','large')
                   desc.setAttribute('warning','')
                   sidetitle.innerText='Showing a warning screen?'
                   let descc=document.createElement('p')
                   descc.setAttribute('warning','')
                   descc.innerText=`Click advanced ❯ Continue to ${qr.link}(unsafe).\n This screen may appear because the cert is self-signed.`
                   desc.innerText='Both devices must be connected to the same network.'
                   let safari=document.createElement('p')
                   safari.innerText='Using safari?'
                   safari.setAttribute('warning','large')
                   let safarifix=document.createElement('p')
                   safarifix.setAttribute('warning','')
                   safarifix.innerText='Safari on iOS might behave different than other browsers. If Safari loops between the warning and app page, restart Safari.'
                   let close=document.createElement('button')
                   close.innerText='close'
                   close.setAttribute('close','')
                   close.className='material-symbols-rounded'
                   close.addEventListener('click',async function(){
                        infull.setAttribute('closing','')
                        await sleep(200)
                        full.remove()
                   })
                   flexc.append(title,desc,sidetitle,descc,safari,safarifix)
                   infull.append(im,flexc)
                   if(fromcammessage){
                    infull.append(close)
                   }
                   full.append(infull)
                   document.body.append(full)
                   refreshLinks()
                   refreshTooltip()
                   await sleep(200)
                   infull.removeAttribute('closing','')
                   fromcammessage=false
                })
             } 
            }
            else if(act=='advanced'){
                ac.setAttribute('tab','')
                if(document.querySelector(`flpop[${act}]`)){
                    document.querySelectorAll(`flpop[${act}]`).forEach(async pop=>{
                        pop.setAttribute('closing','')
                        await sleep(200)
                        pop.closest('f').remove()
                    })
                }
                else{
                 ac.setAttribute('tab','open')
                 S.emit('refresh','NetworkInfo',(refreshed)=>{
                   strength=refreshed.strength
                 })
                 let full=document.createElement('f')
                 let infull=document.createElement('flpop')
                 infull.setAttribute('closing','')
                 infull.setAttribute(act,'')
                 let inscroll=document.createElement('scrollable')
                 infull.appendChild(inscroll)
                 let imim=document.createElement('img')
                 imim.src='/static/Assets/logo.png'
                 let infobar=document.createElement('p')
                 infobar.setAttribute('warning','')
                 if(UPDATECHKROOT!=''){
                    let reltype=''
                    if(window.FluxLAN_release_type){
                        reltype=`/${window.FluxLAN_release_type}`
                    }
                    infobar.innerText=`${window.FluxLAN_version} ${window.FluxLAN_release_date} (${window.FluxLAN_build}${reltype})`
                 }
                 else{window.location.reload()}
                 let flexxr=document.createElement('flexrr')
                 flexxr.setAttribute('update','')
                 let chkupdate=document.createElement('button')
                 chkupdate.innerText='Check for updates'
                 let updatemsg=document.createElement('p')
                 let updateFeatures=document.createElement('ul')
                 let flexC=document.createElement('flexc')
                 flexC.append(updatemsg,updateFeatures)
                 flexxr.append(chkupdate,flexC)
                 let seperatorS=document.createElement('seperator')
                 let seperatorSS=document.createElement('seperator')
                 seperatorS.setAttribute('small','')
                 //info
                 let flexxraa=document.createElement('expandable')
                 flexxraa.setAttribute("info",'')
                 flexxraa.setAttribute('collapsed','')
                 let collapsed=document.createElement('p')
                 collapsed.innerHTML='Show info <span class="material-symbols-rounded" style="vertical-align: center;">keyboard_arrow_down</span>'
                 let infota=document.createElement('p')
                 let ininfo=document.createElement('info')
                 ininfo.addEventListener('click',function(s){s.stopPropagation()})
                 
                 let infotablayout={'Local IP':LOCALIP,"Running on ":`Port ${port}`,"Protocol":protocol,"Network strength":`${strength.signal}${(strength.signal!='error'&&strength.signal!='ethernet')?'%':''} (${strength.dBm}dBm)`,
                "Connected cameras": allcams.length
                }

                 Object.entries(infotablayout).forEach(([name,value])=>{
                    let eachinfo=document.createElement('p')
                    eachinfo.setAttribute('eachinfo','')
                    eachinfo.innerHTML=`${name}<span align='right'>${value}</span>`
                    ininfo.appendChild(eachinfo)
                 })
                 flexxraa.append(collapsed,ininfo)
                 flexxraa.addEventListener('click',function(){
                    if(flexxraa.hasAttribute('collapsed')){
                        flexxraa.style.height=`${flexxraa.scrollHeight}px`
                        flexxraa.removeAttribute('collapsed')
                        collapsed.innerHTML='Hide info <span class="material-symbols-rounded" style="vertical-align: center;">keyboard_arrow_up</span>'
                    }
                    else{
                        flexxraa.setAttribute('collapsed','')
                        flexxraa.style.height=`20px`
                        collapsed.innerHTML='Show info <span class="material-symbols-rounded" style="vertical-align: center;">keyboard_arrow_down</span>'
                    }
                 })

                 //footer
                 let flexxra=document.createElement('flexrr')
                 let clearall=document.createElement('button')
                 let shutall=document.createElement('button')
                 let importpref=document.createElement('button')
                 let exportpref=document.createElement('button')
                 importpref.innerText='Import'
                 importpref.setAttribute('import','')
                 exportpref.innerText='Export'
                 shutall.innerText='Close FluxLAN'
                 importpref.setAttribute('tooltip','import saved data from a .fluxlan backup file')
                 exportpref.setAttribute('tooltip','export data to a .fluxlan backup file')
                 shutall.setAttribute('uSureBoutit','')
                 clearall.setAttribute('warn','')
                 clearall.innerText='clear localStorage'
                 clearall.setAttribute('tooltip','clear localStorage of this device and all connected devices.')
                 flexxra.append(clearall,shutall,importpref,exportpref)
                 // add openlog button
                 flexxra.setAttribute('cache','')
                 let social=document.createElement('flexrr')
                 social.setAttribute('social','')
                 let github=document.createElement('button')
                 github.innerHTML=`<svg viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M56.7937 84.9688C44.4187 83.4688 35.7 74.5625 35.7 63.0313C35.7 58.3438 37.3875 53.2813 40.2 49.9063C38.9812 46.8125 39.1687 40.25 40.575 37.5313C44.325 37.0625 49.3875 39.0313 52.3875 41.75C55.95 40.625 59.7 40.0625 64.2937 40.0625C68.8875 40.0625 72.6375 40.625 76.0125 41.6563C78.9187 39.0313 84.075 37.0625 87.825 37.5313C89.1375 40.0625 89.325 46.625 88.1062 49.8125C91.1062 53.375 92.7 58.1563 92.7 63.0313C92.7 74.5625 83.9812 83.2813 71.4187 84.875C74.6062 86.9375 76.7625 91.4375 76.7625 96.5938L76.7625 106.344C76.7625 109.156 79.1062 110.75 81.9187 109.625C98.8875 103.156 112.2 86.1875 112.2 65.1875C112.2 38.6563 90.6375 17 64.1062 17C37.575 17 16.2 38.6562 16.2 65.1875C16.2 86 29.4187 103.25 47.2312 109.719C49.7625 110.656 52.2 108.969 52.2 106.438L52.2 98.9375C50.8875 99.5 49.2 99.875 47.7 99.875C41.5125 99.875 37.8562 96.5 35.2312 90.2188C34.2 87.6875 33.075 86.1875 30.9187 85.9063C29.7937 85.8125 29.4187 85.3438 29.4187 84.7813C29.4187 83.6563 31.2937 82.8125 33.1687 82.8125C35.8875 82.8125 38.2312 84.5 40.6687 87.9688C42.5437 90.6875 44.5125 91.9063 46.8562 91.9063C49.2 91.9063 50.7 91.0625 52.8562 88.9063C54.45 87.3125 55.6687 85.9063 56.7937 84.9688Z" fill="#8f8f8f"/> </svg>`
                 github.setAttribute('openlink','https://github.com/tromoSM/FluxLAN')
                 github.setAttribute('target','_blank')
                 github.setAttribute('tooltip','open github repo')
                 social.setAttribute('socialfoot','')
                 let otherprojx=document.createElement('p')
                 otherprojx.innerText='Other projects from developer'
                 otherprojx.setAttribute("target",'_blank')
                 let feedback=document.createElement('p')
                 feedback.innerText='feedback or request features'
                 if(navigator.onLine){
                  //stackoverflow.com/a/79207042 @Yassir Hartani
                  try{
                   fetch(LINKLOOKUP).then(n=>
                     n.json()).then(nf=>{
                       otherprojx.setAttribute('indicatorText',`${nf.pages.root.split('//')[1]}projects`)
                       otherprojx.setAttribute('openlink',`${nf.pages.root}?utm_source=fluxlan_inapp_projects_advanced#project`)
                       feedback.setAttribute('openlink',`${nf.pages.feedback}&utm_source=fluxlan_inapp_feedback_advanced`)
                       feedback.setAttribute('indicatorText',`${nf.pages.root.split('//')[1]}feedback-or-request-features`)
                   })}
                   catch(er){console.error(er)}
                  }
                else{
                    console.error('user offline')
                    otherprojx.setAttribute('indicatorText',`tromosm.github.io/projects`)
                    otherprojx.setAttribute('openlink',`https://tromosm.github.io/tromoSM/t/?utm_source=fluxlan_inapp_projects_advanced#project`)
                    feedback.setAttribute('openlink',`https://tromosm.github.io/tromoSM/t/?feedback=true&utm_source=fluxlan_inapp_feedback_advanced`)
                    feedback.setAttribute('indicatorText',`tromosm.github.io/feedback-or-request-features`)
                    if(!navigator.onLine){
                    console.error('user offline')
                    }
                  }
                let privacy=document.createElement('p')
                privacy.innerText='privacy statement'
                privacy.setAttribute('tooltip','open privacy statement')
                privacy.setAttribute('warning','')
                privacy.setAttribute('privacy','')
                privacy.addEventListener('click',async function(){
                 if(document.querySelector(`flpop[privacy]`)){
                    document.querySelectorAll(`flpop[privacy]`).forEach(async pop=>{
                        pop.setAttribute('closing','')
                        await sleep(200)
                        pop.closest('f').remove()
                    })
                 }
                 let fullx=document.createElement('f')
                 let infullx=document.createElement('flpop')
                 infullx.setAttribute('closing','')
                 infullx.setAttribute('privacy','')
                 let close=document.createElement('button')
                 close.innerText='close'
                 close.setAttribute('close','')
                 close.className='material-symbols-rounded'
                 close.addEventListener('click',async function(){
                        infullx.setAttribute('closing','')
                        await sleep(200)
                        fullx.remove()
                 })
                 infullx.innerHTML=`
                 <h1><strong>Privacy statement</strong></h1>
                 <p>This application shares limited technical information once during setup, including:</p>
                 <ul>
                  <li>Application version</li>
                  <li>OS name and version</li>
                  <li>Application build information</li>
                 </ul>
                 <p warning>example : v1.0(stable/lite) Windows 10_win32</p>
                 <p>This information is used only to help improve compatibility, stability, and overall support across different platforms and releases.</p>
                 `
                 if(navigator.onLine){

                 await fetch(UPDATECHKROOT).then(inf=>inf.json()).then(info=>{
                    S.emit('INFO','pp',(privacypolicy)=>{
                        if(privacypolicy.version<info.legal.privacy_policy.version){
                            infullx.innerHTML=info.legal.privacy_policy.innerhtml
                            console.log(`using online privacy policy.`)
                            console.log(`    offline version: ${privacypolicy.version}\n    online version: ${info.legal.privacy_policy.version}`)
                            console.log(`online version is ${parseInt(info.legal.privacy_policy.version)-parseInt(privacypolicy.version)} versions ahead.`)
                        }      
                        if(!infull.querySelector('[close]')){
                          infullx.append(close)
                        }
                    })
                  })
                 } 
                 if(!infull.querySelector('[close]')){
                    infullx.append(close)
                 }
                 fullx.appendChild(infullx)
                 document.body.append(fullx)
                 await sleep(200)
                 infullx.removeAttribute('closing','')
                 refreshTooltip()
                 refreshLinks()
                })

                social.append(github,otherprojx,feedback,privacy)

                 let footer=document.createElement('flexrr')
                 let copyright=document.createElement('p')
                 copyright.setAttribute('warning','')
                 copyright.innerHTML='© 2026 tromoSM. Licensed under <a href="http://www.apache.org/licenses/LICENSE-2.0">apache 2.0</a>. FluxLAN is open-source • <a href="https://github.com/tromoSM/FluxLAN">contribute here</a>'
                 footer.append(copyright)
                 inscroll.append(imim,infobar,flexxr,seperatorSS,flexxraa,seperatorS,flexxra,social,footer)
                 full.appendChild(infull)
                 document.body.append(full)
                 await sleep(200)
                 infull.removeAttribute('closing','')
                 refreshTooltip()
                 refreshLinks()
                chkupdate.addEventListener('click',async function(){
                 try{
                 fetch(UPDATECHKROOT).then(n=>
                  n.json()).then(async app=>{
                    if(app.main.version_release>window.FluxLAN_version_release){
                        chkupdate.innerText='Download installer'
                        chkupdate.addEventListener('click',async function(){
                            chkupdate.setAttribute('busy','')
                            chkupdate.innerText='Downloading'
                            chkupdate.setAttribute('disabled','')
                            let tempdown=document.createElement('a')
                            if(window.FluxLAN_release_type=='performance'){
                             tempdown.href=app.update.update_url.performance
                            }
                            else if(window.FluxLAN_release_type=='lite'){
                             tempdown.href=app.update.update_url.lite
                            }
                            tempdown.style.display='none'
                            document.body.appendChild(tempdown)
                            tempdown.click()
                            await sleep(1000)
                            chkupdate.removeAttribute('busy')
                            chkupdate.innerText='Downloaded'
                        })
                        updatemsg.innerHTML=`Update available : <strong>${app.main.version}</strong>(${app.update.update_date})`
                        if(app.update.security_patch){
                        updatemsg.innerHTML=`Update available : <strong>${app.main.version}</strong>(${app.update.update_date}) - <span style='color:#f55;'>security patch</span>`
                        }
                        await updateFeatures.querySelectorAll('li').forEach(async li=>{
                           await li.remove()
                        })
                        app.update.update_features.forEach(fe=>{
                            let eachli=document.createElement('li')
                            eachli.innerText=fe
                            updateFeatures.appendChild(eachli)
                        })
                        
                    }
                    else if(app.main.version_release==window.FluxLAN_version_release){
                        chkupdate.setAttribute('disabled','')
                        let p=document.createElement('p')
                        p.innerText='FluxLAN is up to date.'
                        p.setAttribute('warning','')
                        flexC.appendChild(p)
                    }
                    else if(app.main.version_release<window.FluxLAN_version_release){
                        chkupdate.setAttribute('disabled','')
                        let p=document.createElement('p')
                        p.innerText='FluxLAN is up to date (stable).'
                        p.setAttribute('warning','')
                        flexC.appendChild(p)
                    }
                  })
                 }
                 catch(e){console.error(e)}
                 })
                clearall.addEventListener('click',function(){
                    clearall.setAttribute('disabled','')
                    clearall.setAttribute('busy','')
                    S.emit('ClearAll','')
                    localStorage.clear()
                    if(allcams.length!=0){
                     S.on('AdminCleared',function(){
                        if(clearall.hasAttribute('disabled')){
                            clearall.removeAttribute('disabled')
                        }
                     })
                    }
                    else{
                        alert('No device is connected to FluxLAN. Only your localStorage will be cleared.')
                        if(clearall.hasAttribute('disabled')){
                            clearall.removeAttribute('disabled')
                        }
                    }
                    window.location.reload()
                })
                
                shutall.addEventListener('click',function(){
                    S.emit('CloseSelf','verified')
                    shutall.setAttribute('disabled','')
                    shutall.setAttribute('busy','')
                    S.on('closing',function(){
                        shutall.innerText='Closing FluxLAN'
                    })
                })
                importpref.addEventListener('click',async function(){
                    S.emit('importdata')
                    importpref.setAttribute('disabled','')
                    await sleep(500)
                    importpref.setAttribute('busy','')
                })
                exportpref.addEventListener('click',function(){
                    S.emit('exportdata',JSON.stringify(localStorage))
                })
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
        document.querySelectorAll(`[stream='src'][from='${user}']`).forEach(async all=>{
            all.setAttribute('empty','')
            await sleep(200)
            all.closest('relborder').remove()
        })
        if(allcams.length==0){
            cammessage('show')
        }
    })
    S.on('adminJOIN',async function(user){
        //message(user)
        notification({title:`${user} joined`,body:`${user} joined.`,icon:'static/Assets/favicon.png',timeout:3})
        cammessage('hide')
        if(document.querySelector('flpop[link-camera]')){
            document.querySelector('flpop[link-camera]').setAttribute('closing','')
            await sleep(200)
            document.querySelector('flpop[link-camera]').closest('f').remove()
        }
    })
    if(document.querySelector(`[stream='src']`)){
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
    }
    else{
        cammessage('show')
    }
    function refreshTooltip(){
    document.querySelectorAll('[tooltip]').forEach(yo=>{
        if(!yo.hasAttribute('tooltipset')){
            yo.setAttribute('tooltipset','')
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
    })}
    })
    }
    refreshTooltip()
    if(dynamiclink.get('linkcam')=='true'){
       if (document.querySelector('[action="link-camera"]')) {
        document.querySelector('[action="link-camera"]').click()
       }
    }
     if(dynamiclink.get('checkupdate')=='true'){
     (async()=>{
       await sleep(200)
       if (document.querySelector('[action="advanced"]')) {
        console.log('ayo')
        document.querySelector('[action="advanced"]').click()
        await sleep(250)
        if(document.querySelector('flexrr[update] button')){
        console.log('yo')
        await sleep(100)
        document.querySelector('flexrr[update] button').click()
        }
       }
     })()
     }

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
    document.querySelectorAll('[stream]').forEach(im=>{
        im.addEventListener('dbclick',function(){
            if(im.hasAttribute('grid')){
                im.removeAttribute('grid')
            }
            else{im.setAttribute('grid','')}
        })
    })
    S.on('recieveImport',async function(json){
     //stackoverflow/a/34816783
     let ADDITIONAL_INFO=['FLUXLAN',"Export_info","SessionData"]
     await Object.keys(json).forEach(function(key){
        if(!ADDITIONAL_INFO.includes(key)){
            localStorage.setItem(key,json[key])
        }
     })
     let importb=document.querySelector('[import]')
     if(importb){
        if(importb.hasAttribute('busy')){
        await sleep(500)
        importb.removeAttribute('busy')
        }
        importb.innerText='Success'
   }
    })
    S.on('disconnect',async function(){
        if(document.querySelector('flexrr[cache] button[usureboutit]')){
            document.querySelectorAll('flexrr[cache] button[usureboutit]').forEach(async usure=>{
                if(usure.innerText=='Close FluxLAN'){
                        usure.innerText='Closing FluxLAN'
                        await sleep(500)
                        usure.removeAttribute('busy')
                        usure.innerText='FluxLAN is closed'
                }
            })
        }
        else{
                 let fullx=document.createElement('f')
                 let infullx=document.createElement('flpop')
                 infullx.setAttribute('closing','')
                 infullx.setAttribute('disconnected','')
                 let close=document.createElement('button')
                 close.innerText='close'
                 close.setAttribute('close','')
                 close.className='material-symbols-rounded'
                 close.addEventListener('click',async function(){
                        infullx.setAttribute('closing','')
                        await sleep(200)
                        fullx.remove()
                 })
                 let icon=document.createElement('p')
                 icon.innerHTML='<span class="material-symbols-rounded" camicon>power</span>'
                 let title=document.createElement('h1')
                 title.innerText='FluxLAN is closed'
                 let description=document.createElement('p')
                 description.innerText=`Didn't close FluxLan? try refreshing the page.`
                 description.setAttribute('warning','')
                 let flexc=document.createElement('flexc')
                 flexc.append(title,description)
                 infullx.append(icon,flexc,close)
                 fullx.append(infullx)
                document.body.append(fullx)
                await sleep(200)
                infullx.removeAttribute('closing')
        }
    })
    S.on('connect', function(){
        if(document.querySelector('[disconnected]')){
            document.querySelectorAll('[disconnected]').forEach(async popup=>{
                popup.setAttribute('closing','')
                await sleep(200)
                popup.remove()
            })
        }
    })
})
