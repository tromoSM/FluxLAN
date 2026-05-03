from flask import Flask,request,render_template,abort
from flask_socketio import SocketIO,emit
import os
import sys
from windows_toasts import AudioSource, Toast, ToastAudio,WindowsToaster
import ctypes
import base64
from datetime import datetime
import subprocess

main=Flask(__name__,template_folder=os.path.join("templates"),static_folder=os.path.join("static"))
MAINUSERSDI={}
ALLUSERS=[] #keep this
S=SocketIO(main,cors_allowed_origins="*")
LASTFrame='__not-found__'
orientation='up'
stream1using=False
stream2using=False
# FIRST TIME
if not os.path.exists(os.path.join(os.path.expanduser("~"),'Pictures','FluxLAN')):
    os.makedirs(os.path.join(os.path.expanduser("~"),'Pictures','FluxLAN'))
if not os.path.exists(os.path.join(os.path.expanduser("~"),'Pictures','FluxLAN','Captures')):
    os.makedirs(os.path.join(os.path.expanduser("~"),'Pictures','FluxLAN',"Captures"))
# GLOBAL UI FUNCc
def joinev(user):
    if user not in ALLUSERS:
     ALLUSERS.append(user)
    else:
       #emtIOerrUSR
       pass
    S.emit('adminJOIN',user)
    S.emit('CAMlist',ALLUSERS)  

def leaveev(user):
    if user in ALLUSERS:
        ALLUSERS.remove(user)
    S.emit('adminLEAVE',user)  
    for i in ALLUSERS:
       print(i)
    S.emit('CAMlist',ALLUSERS)  

def UserError(user,title,description): # DONT USE YET
   S.emit('notification',{"user":user,"title":title,'description':description}) #change to S.to SID

def HostNotification(title,description,fallbackicon=0x40):
   if(sys.platform=='win32'):
       try:
        maintk=WindowsToaster("FluxLAN")
        toast=Toast()
        toast.text_fields=[title,description]
        toast.audio=ToastAudio(AudioSource.Default, looping=0)
        maintk.show_toast(toast)
       except Exception as ex:
          ctypes.windll.user32.MessageBoxW(0,f"{title.upper()}\n{"￣"*(int(len(description)/2))}\n{description}","FluxLAN",fallbackicon)
          #add to err log 10>win {ex}
#---
@S.on('Process')
def mainroute(data):
   global LASTFrame
   if data!=LASTFrame:
     S.emit('Stream',data)
     LASTFrame=data

@S.on("join")
def ini(dih):
    MAINUSERSDI[request.sid]=dih['clieUSR']
    curuser=MAINUSERSDI.get(request.sid,request.sid)
    print(f"│ User connected : {curuser}")
    joinev(curuser)
    print(len(MAINUSERSDI))

@S.on('disconnect')
def left():
    curUser=MAINUSERSDI.get(request.sid,request.sid)
    print(f"│ User disconnected : {curUser}")
    leaveev(curUser)      
    MAINUSERSDI.pop(request.sid,None)

@S.on('CamMinimize')
def min(user):
    leaveev(user)

@S.on('CamRevive')
def revive(user):
    joinev(user)

@S.on('INFO')
def ask(q):
   if q=='suggStream':
      return {'stream': len(MAINUSERSDI)}
   
@S.on('OpenFolder')
def openF(fl):
    if sys.platform=='win32':
       if fl=='user/Pictures/app':
        os.startfile(os.path.join(os.path.expanduser("~"),'Pictures','FluxLAN'))
@main.route('/')
def web():
 return render_template('index.html')
@main.route('/dashboard')
def admin():
   if(request.remote_addr!='127.0.0.1'):
      abort(403)
      return 'sybau'
   return render_template('tromoSM-admin.html')
@S.on('Pref')
def mainfunc(pref):
        S.emit('JSPrefREC',pref)
@S.on('SaveImage')
def save(data):
    datetimeX=datetime.now()
    if ',' in data:
      header,base=data.split(',')
    else:
      base=data
    
    with open(f'{os.path.join(os.path.expanduser("~"),"Pictures","FluxLAN","Captures",f"Capture {str(datetimeX.date())}_{str(datetimeX.time()).replace(':','-')}.jpg")}',"wb") as im:
       im.write(base64.b64decode(base))
    return {"file":str(f"Capture {str(datetimeX.date())}_{str(datetimeX.time()).replace(':','-')}"),'dir':"Captures"}
@S.on("OpenSelected")
def openS(path):
 if sys.platform=='win32':
   try:
    subprocess.Popen(f'explorer /select,{os.path.normpath(os.path.join(os.path.expanduser("~"),"Pictures","FluxLAN","Captures",f"{path}.jpg"))}') 
   except Exception as err:
    print(err)
 else: 
   os.startfile(os.path.join(os.path.expanduser("~"),"Pictures","FluxLAN","Captures",f"{path}.jpg"))

@S.on('OpenDir')
def openD(path):
    os.startfile(os.path.join(os.path.expanduser("~"),"Pictures","FluxLAN",path))

if(__name__=="__main__"):
    S.run(main,debug=True,host='0.0.0.0',port='84',ssl_context=('192.168.1.XX.pem', '192.168.1.XX-key.pem'))
