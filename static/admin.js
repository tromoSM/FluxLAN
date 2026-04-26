window.addEventListener('DOMContentLoaded',function(){
    const S=io()
    S.on('Stream',function(stream){
        document.querySelector(`[stream='src']`).src=stream.rec
        document.querySelector(`[stream='src']`).style.transform=`rotate(${stream.ori}deg)`
    })
})
