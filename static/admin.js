window.addEventListener('DOMContentLoaded',function(){
    const S=io()
    S.on('Stream',function(stream){
        document.querySelector(`[stream='src']`).src=stream.rec
        document.querySelector(`[stream='src']`).style.transform=`rotate(${stream.ori}deg)`
    })
    document.querySelector(`[admin="face"]`).addEventListener('click',function(){
        S.emit('Pref',{face:"toggle"}) 
    })

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
