from flask import Flask,request,render_template,abort
from flask_socketio import SocketIO,emit
import os
import sys
from windows_toasts import AudioSource, Toast, ToastAudio,WindowsToaster
import ctypes
import base64
from datetime import datetime
import subprocess
import platformdirs
import json
import signal

APP_VERSION='v0.9 pre'
APP_VERSION_RELEASE=1
APP_DATE='2026/05'
APP_UPDATECHK_ROOT='https://raw.githubusercontent.com/tromoSM/tromoSM-assets/main/repos/FLUXLAN/manifest.json'

main=Flask(__name__,template_folder=os.path.join("templates"),static_folder=os.path.join("static"))

MAINUSERSDI={}
ALLUSERS=[]
RECORDED_DATA=[]

S=SocketIO(main,cors_allowed_origins="*")

LASTFrame='__not-found__'
orientation='up'
RecordingRunning=False
CurrentRecordStream=False
LASTrecStamp=None

# FIRST TIME
if not os.path.exists(os.path.join(os.path.expanduser("~"),'Pictures','FluxLAN')):
    os.makedirs(os.path.join(os.path.expanduser("~"),'Pictures','FluxLAN'))

if not os.path.exists(os.path.join(os.path.expanduser("~"),'Pictures','FluxLAN','Captures')):
    os.makedirs(os.path.join(os.path.expanduser("~"),'Pictures','FluxLAN',"Captures"))

maindatadir=platformdirs.user_data_dir(appname='FluxLAN',appauthor='tromoSM')   
os.makedirs(maindatadir,exist_ok=True)

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
def AdminNotification(title='',body='',icon='__none__',timeout=4,level='info'):
   S.emit('AdminNotification',{'title':title,"body":body,"icon":icon,"timeout":timeout,"level":level})
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


def onerr(type,value,traceback):
   print(f'type : {type}\nvalue : {value}\ntraceback:{traceback}')

#---
@S.on('Process')
def mainroute(data):
   global LASTFrame
   if RecordingRunning:
      if data.get("stream")==CurrentRecordStream:
         header,base=data.get('rec').split(',')
         RECORDED_DATA.append(base)
         
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

@S.on('connect')
def info():
       S.emit('CAMlist',ALLUSERS)  

@S.on('CamMinimize')
def min(user):
    leaveev(user)

@S.on('CamRevive')
def revive(user):
    joinev(user)

@S.on('INFO')
def ask(q):
   global RecordRunning,MAINUSERDI,ALLUSERS,APP_DATE,APP_UPDATECHK_ROOT,APP_VERSION,APP_VERSION_RELEASE
   if q=='suggStream':
      S.emit('CAMlist',ALLUSERS)  
      return {'stream': len(MAINUSERSDI)}
   elif q=='ifRecRunning':
      return {'running': str(RecordingRunning)}
   elif q=='about':
      return {'date':APP_DATE,'updatechk_root':APP_UPDATECHK_ROOT,'version':APP_VERSION,'version_release':str(APP_VERSION_RELEASE)}
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

@S.on('Record')
def record(data):
    global RecordingRunning,RECORDED_DATA,CurrentRecordStream,LASTrecStamp
    if data.get('command')=='start':
       if not RecordingRunning:
            print('Start rec')
            CurrentRecordStream=data.get('stream')
            RecordingRunning=True
            LASTrecStamp=datetime.now()

       else: 
         RECORDED_DATA.clear()
    elif data.get('command')=='stop':
        if RecordingRunning: 
           RecordingRunning=False
           print('stop')
           AdminNotification(title='Processing recorded video',body='Recorded video is currently processing.',timeout=3)
           tempbinaryrecs=bytearray()
           for frame in RECORDED_DATA:
              eachfr=base64.b64decode(frame)
              tempbinaryrecs.extend(eachfr)
           
           with open(f'{os.path.join(os.path.expanduser("~"),"Pictures","FluxLAN","Captures",f"Recording {str(LASTrecStamp.date())}_{str(LASTrecStamp.time()).replace(':','-')}.mp4")}',"wb") as vid:
             vid.write(tempbinaryrecs)             
           
           AdminNotification(title='Video saved',body=f'Video saved to <span onclick="openDir(`{'Captures'}`)">Captures/</span><span button="open" onclick="{os.path.join(os.path.expanduser("~"),"Pictures","FluxLAN","Captures",f"Recording {str(LASTrecStamp.date())}_{str(LASTrecStamp.time()).replace(':','-')}.mp4")}">open</span>',timeout='never')

@S.on('hostpref') #dont use
def pref(com):
    prefr=com.get("pref")
    with open(os.path.normpath(os.path.join(platformdirs.user_data_dir(appname='FluxLAN',appauthor='tromoSM'),'preferences.json')),'r') as pref:
     saved=json.load(pref)
    command=com.get('command')
    if command=='get':
        saved.get(prefr)
    elif command=='set':
      saved.append({str(prefr):str(com.get('value'))})
      with open(os.path.normpath(os.path.join(platformdirs.user_data_dir(appname='FluxLAN',appauthor='tromoSM'),'preferences.json')),'w') as pref:
       json.dump(saved,pref)

@S.on('BatteryChange')
def battery(data):
   S.emit('adminBatteryChange',data) 

@S.on('ClearAll')
def clear(e):
   S.emit('ClientClear','')

@S.on('ClearedAll')
def cleared(user):
   S.emit('AdminCleared','')
   AdminNotification(title=f"{user}'s localstorage is being cleared",body=f"{user}'s saved preferences and usernames are being cleared",timeout=5,level='_info_')

@S.on('CloseSelf')
def close(ver):
   if(ver=='verified'):
    AdminNotification(title='FluxLAN is closing',body='FluxLAN will be closed in a minute',timeout="never")
    S.emit('closing','normal')
    os.kill(os.getpid(),signal.SIGINT)

sys.excepthook=onerr     
if(__name__=="__main__"):
    S.run(main,debug=True,host='0.0.0.0',port='84',ssl_context=('192.168.1.XX.pem', '192.168.1.XX-key.pem'))
    
