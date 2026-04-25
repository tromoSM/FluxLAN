window.addEventListener('DOMContentLoaded',function(){
    setInterval(()=>{
     fetch('/stream')
     .then(response=> response.json())
     .then(re=>{
        document.querySelector(`[stream='src']`).src=re.rec
        if(re.ori=='up'){
            document.querySelector(`[stream='src']`).style.transform='rotate(0deg)'
        }
        else{
            document.querySelector(`[stream='src']`).style.transform='rotate(90deg)'
        }
     })
     .catch(err=>{
      console.error('Error',err)
     })
    },100)
})
