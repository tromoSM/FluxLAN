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
import numpy
import cv2
import socket
import webbrowser
import tkinter as tk
from tkinter import filedialog
import queue
import threading
from rich.logging import RichHandler
import logging
from rich.highlighter import NullHighlighter
import requests
import qrcode
from io import BytesIO
import cryptography

APP_VERSION='v0.9 pre'
APP_VERSION_RELEASE=0
APP_DATE='2026/05'
APP_UPDATECHK_ROOT='https://raw.githubusercontent.com/tromoSM/tromoSM-assets/main/repos/FLUXLAN/manifest.json'
APP_LINK_LOOKUP='https://raw.githubusercontent.com/tromoSM/tromoSM-assets/main/root/info.json'
APP_BUILD='beta'
APP_SUPPORT='https://tromosm.ct.ws/?feedback=true&utm_source=normal_fluxlan_console'
APP_SUPPORT_LTS_FEEDBACK="https://tromosm.github.io/tromoSM/t/?feedback=true&utm_source=lts_fluxlan_console"


main=Flask(__name__,template_folder=os.path.join("templates"),static_folder=os.path.join("static"))

S=SocketIO(main,cors_allowed_origins="*",async_mode='threading')

MAINUSERSDI={}
ALLUSERS=[]
RECORDED_DATA=[]

DEVELOPER_MODE=True
LASTFrame='__not-found__'
orientation='up'
RecordingRunning=False
CurrentRecordStream=False
LASTrecStamp=None
MotionDetecting=False
MotionFrameSkip=0
MotionFrameLS=None
MainIP='unavailable'
MainPort='84'
Protocol=NetworkStrength='unavailable'
CloseWhenBattery=60

root = tk.Tk()
root.withdraw()
tk_q=queue.Queue()

#Logging
if DEVELOPER_MODE: #toggle this in production
 FlaskLog=logging.getLogger('werkzeug')
 FlaskLog.level=logging.ERROR

FluxLanLog=logging.getLogger(__name__)
logging.basicConfig(handlers=[RichHandler(rich_tracebacks=True,show_level=False,show_path=False,show_time=False,markup=True,highlighter=NullHighlighter())],format='%(message)s',level=logging.INFO)

def FluxLog(message,level='info',padding=1,CoverText=False,KeyValues=False):
   colortable={'info':'bright_blue','error':'red',"high":'bright_red','debug':'magenta','warning':'yellow'}
   if not CoverText and not KeyValues:
    message=f"[{colortable.get(level)}]|[/{colortable.get(level)}] {message}"
   elif not KeyValues:
    message=f"[{colortable.get(level)}]| {message}[/{colortable.get(level)}]"
   if KeyValues:
      colored=message.split(':',1)
      message=f"[{colortable.get(level)}]| {colored[0]}:[/{colortable.get(level)}]{colored[1]}"
   Loglevel={"info":FluxLanLog.info,"error":FluxLanLog.error,'high':FluxLanLog.info,'debug':FluxLanLog.debug,'warning':FluxLanLog.warning}
   
   LogFunc=Loglevel.get(level)
   LogFunc(f'{" "*padding}{message}') 

#STARTUP 
terminalsize=os.get_terminal_size()
if(terminalsize.columns>=(107+len(APP_VERSION))):
 print(f"""
 &&&&&&&&&& &&&        &&&    &&&&  &&&&  &&&&  &&&&&&                 &&&&&&&&&        &&&&&&&&    &&&&& 
 &&&        &&&        &&&    &&&&   &&&&&&&&   &&&&&&                &&&&&&&&&&&      &&&&&&&&&&   &&&&& 
 &&&&&&&&&& &&&        &&&    &&&&     &&&&     &&&&&&               &&&&&  &&&&&&     &&&&&&&&&&&  &&&&& 
 &&&&&&&&&& &&&        &&&    &&&&    &&&&&&    &&&&&&              &&&&&    &&&&&&    &&&&&& &&&&& &&&&& 
 &&&        &&&        &&&    &&&&   &&& &&&&   &&&&&&             &&&&&&&&&&&&&&&&&   &&&&&&  &&&&&&&&&& 
 &&&        &&&&&&&&&& &&&&&&&&&&  &&&&   &&&&   &&&&&&&&&&&&&&&  &&&&&         &&&&&  &&&&&&   &&&&&&&&& {APP_VERSION}
 """)
else:
   print(f"""
 d88888b db      db    db db    db db       .d8b.  d8b   db 
 88'     88      88    88 `8b  d8' 88      d8' `8b 888o  88 
 88ooo   88      88    88  `8bd8'  88      88ooo88 88V8o 88 
 88~~~   88      88    88  .dPYb.  88      88~~~88 88 V8o88 
 88      88booo. 88b  d88 .8P  Y8. 88booo. 88   88 88  V888 
 YP      Y88888P ~Y8888P' YP    YP Y88888P YP   YP VP   V8P {APP_VERSION}
""")


if DEVELOPER_MODE:
   FluxLog('Running in developer mode',level='high')

def refreshNetworkInfo():
 global NetworkStrength
 if sys.platform=='win32':
  #stackoverflow/a/39463881
  tempbytes=subprocess.check_output(["netsh","wlan","show","network","mode=Bssid"],text=True)
  for line in tempbytes.split('\n'):
     if "Signal" in line:
        signal=int(line.split(':')[1].strip().replace('%',''))
        dBm=(signal//2)-100
        NetworkStrength={"signal":signal,"dBm":dBm}
        FluxLog(f"Refreshing network info : signal {signal} dBm {dBm}dBm ",level='info',CoverText=True,KeyValues=True)
refreshNetworkInfo()

def linkLookup():
   global APP_SUPPORT
   try:
      mainRes=requests.get(url=APP_SUPPORT,timeout=5)
      if mainRes.status_code==200:
         pass
      else :
         APP_SUPPORT=APP_SUPPORT_LTS_FEEDBACK
         FluxLog(f'Main support site is returning {mainRes.status_code} : using fallback site',level='warning',KeyValues=True)
   except requests.exceptions.ConnectionError:
         APP_SUPPORT=APP_SUPPORT_LTS_FEEDBACK
         FluxLog(f'Main support site is not responding : using fallback site',level='warning',KeyValues=True)

linkLookup()

# FIRST TIME
if not os.path.exists(os.path.join(os.path.expanduser("~"),'Pictures','FluxLAN')):
    os.makedirs(os.path.join(os.path.expanduser("~"),'Pictures','FluxLAN'))
    FluxLog('First time running : Creating media folders',KeyValues=True)

if not os.path.exists(os.path.join(os.path.expanduser("~"),'Pictures','FluxLAN','Captures')):
    os.makedirs(os.path.join(os.path.expanduser("~"),'Pictures','FluxLAN',"Captures"))

if not os.path.exists(os.path.join(os.path.expanduser("~"),'Pictures','FluxLAN',"Motion detected")):
    os.makedirs(os.path.join(os.path.expanduser("~"),'Pictures','FluxLAN',"Motion detected"))

maindatadir=platformdirs.user_data_dir(appname='FluxLAN',appauthor='tromoSM')   

os.makedirs(maindatadir,exist_ok=True)

SOCKET=socket.socket(socket.AF_INET,socket.SOCK_DGRAM)
try:
   SOCKET.connect(('8.8.8.8',80))
   MainIP=SOCKET.getsockname()[0]
except Exception as err:
   MainIP='127.0.0.1'
   FluxLog(err,level='error',CoverText=True)
finally:
   FluxLog(f'Refreshing Local IP address {MainIP}')
   SOCKET.close()

mainqr=qrcode.QRCode(version=1,box_size=10,border=1)
mainqr.add_data(f"https://{MainIP}:{MainPort}")
mainqr.make(fit=True)
img=mainqr.make_image(fill_color='black',back_color='white')
buffer=BytesIO()
img.save(buffer,format='JPEG')
MainQR=base64.b64encode(buffer.getvalue()).decode()

# GLOBAL UI FUNCc

def joinev(user):
    FluxLog(f'New camera connected : {user}',KeyValues=True)
    if user not in ALLUSERS:
     ALLUSERS.append(user)
    else:
       #emtIOerrUSR
       pass
    S.emit('adminJOIN',user)
    S.emit('CAMlist',ALLUSERS)  

def leaveev(user):
    if user in ALLUSERS:
        FluxLog(f'Camera disconnected : {user}',KeyValues=True)
        ALLUSERS.remove(user)
    S.emit('adminLEAVE',user)  
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
          FluxLog(f'Limited support - Windows version might be less than 10. Exeption : {ex}',level='warning',CoverText=True)
          #add to err log 10>win {ex}
       finally:
        FluxLog(f'Notification sent to host : {title}',KeyValues=True)

def onerr(type,value,traceback):
   print(f'type : {type}\nvalue : {value}\ntraceback:{traceback}')

#---
@S.on('Process')
def mainroute(data):
   global LASTFrame,MotionFrameSkip
   if RecordingRunning:
      if data.get("stream")==CurrentRecordStream:
         header,base=data.get('rec').split(',')
         RECORDED_DATA.append(base)
         
   if data!=LASTFrame:
     S.emit('Stream',data)
     if MotionDetecting and MotionFrameSkip==0:
         MotionDetect()
     if(MotionFrameSkip!=5):
        MotionFrameSkip+=1
     else:
        MotionFrameSkip=0
     LASTFrame=data

@S.on("join")
def ini(dih):
    MAINUSERSDI[request.sid]=dih['clieUSR']
    curuser=MAINUSERSDI.get(request.sid,request.sid)
    joinev(curuser)
    print(len(MAINUSERSDI))

@S.on('disconnect')
def left():
    curUser=MAINUSERSDI.get(request.sid,request.sid)
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
   global RecordingRunning,MAINUSERSDI,ALLUSERS,APP_DATE,APP_UPDATECHK_ROOT,APP_VERSION,APP_VERSION_RELEASE,APP_LINK_LOOKUP,APP_BUILD,MainIP,MainPort
   if q=='suggStream':
      S.emit('CAMlist',ALLUSERS)
      return {'stream': len(MAINUSERSDI)}
   elif q=='ifRecRunning':
      return {'running': str(RecordingRunning)}
   elif q=='about':
      refreshNetworkInfo()
      return {'date':APP_DATE,'updatechk_root':APP_UPDATECHK_ROOT,'version':APP_VERSION,'version_release':str(APP_VERSION_RELEASE),'link_lookup':APP_LINK_LOOKUP,'build':APP_BUILD,"ip":MainIP,'port':MainPort,'protocol':Protocol,"strength":NetworkStrength}
   elif q=='qr':
      return {"qr": MainQR,"link":f"https://{MainIP}:{MainPort}"}
@S.on('OpenFolder')
def openF(fl):
    if sys.platform=='win32':
       if fl=='user/Pictures/app':
        os.startfile(os.path.join(os.path.expanduser("~"),'Pictures','FluxLAN'))
        FluxLog(f'Opening {os.path.join(os.path.expanduser("~"),'Pictures','FluxLAN')}')
    else:
       FluxLog(f'Couldnt execute function : FluxLAN do not fully support {sys.platform} yet. Report issue : {APP_SUPPORT}',level='error',KeyValues=True)        

@main.route('/')
def web():
 global Protocol
 Protocol=request.scheme
 return render_template('index.html')

@main.route('/dashboard')
def admin():
   if(request.remote_addr!='127.0.0.1'):
      FluxLog(f'Dashboard is fobidden to IPs other than 127.0.0.1 or localhost. Use localhost:{MainPort} or 127.0.0.1:{MainPort} instead.',level='warning',CoverText=True)
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
    FluxLog(f'Image saved to : {os.path.join(os.path.expanduser("~"),"Pictures","FluxLAN","Captures",f"Capture {str(datetimeX.date())}_{str(datetimeX.time()).replace(':','-')}.jpg")}',KeyValues=True)
    return {"file":str(f"Capture {str(datetimeX.date())}_{str(datetimeX.time()).replace(':','-')}"),'dir':"Captures"}

@S.on("OpenSelected")
def openS(data):
 path=data.get('file')
 folder=data.get('folder')
 if sys.platform=='win32':
   try:
    subprocess.Popen(f'explorer /select,{os.path.normpath(os.path.join(os.path.expanduser("~"),"Pictures","FluxLAN",folder,f"{path}.jpg"))}') 
   except Exception as err:
    FluxLog(f'Couldnt execute function : {err}',level='error',KeyValues=True)
 else: 
   os.startfile(os.path.join(os.path.expanduser("~"),"Pictures","FluxLAN",folder,f"{path}.jpg"))
   FluxLog(f'Some of the features might not work. FluxLan doesnt fully support {sys.platform} yet. Report issue : {APP_SUPPORT}',level='warning',KeyValues=True)        

@S.on('OpenDir')
def openD(path):
    os.startfile(os.path.join(os.path.expanduser("~"),"Pictures","FluxLAN",path))
    FluxLog(f'Opening FluxLan media folder')

@S.on('Record')
def record(data):
    global RecordingRunning,RECORDED_DATA,CurrentRecordStream,LASTrecStamp
    if data.get('command')=='start':
       if not RecordingRunning:
            FluxLog('Starting recording')
            CurrentRecordStream=data.get('stream')
            RecordingRunning=True
            LASTrecStamp=datetime.now()

       else: 
         RECORDED_DATA.clear()
         FluxLog('A recording is still running : Clearing current recording to start new recording',level='error',KeyValues=True)

    elif data.get('command')=='stop':
        if RecordingRunning: 
           RecordingRunning=False
           FluxLog('Stopping recording')
           AdminNotification(title='Processing recorded video',body='Recorded video is currently processing.',timeout=3)
           firstfr=None
           for eachfr in RECORDED_DATA:
            try:
             bytess=base64.b64decode(eachfr)
             npar=numpy.frombuffer(bytess,numpy.uint8)
             eachbyte=cv2.imdecode(npar,cv2.IMREAD_COLOR)
             if eachbyte is not None:
               firstfr=eachbyte
               break
            except:
               pass
           if firstfr is None:
              FluxLog('No frames found',level='error')
           recheight,recwidth=firstfr.shape[:2]
           saved=os.path.join(os.path.expanduser("~"),"Pictures","FluxLAN","Captures",f"Recording {str(LASTrecStamp.date())}_{str(LASTrecStamp.time()).replace(':','-')}.mp4")
           mainencd=cv2.VideoWriter_fourcc(*'mp4v')
           mainvid=cv2.VideoWriter(saved,mainencd,30,(recwidth,recheight))
           mainvid.write(firstfr)
           mainlogo=cv2.imread(os.path.abspath('static/Assets/logo-w.png'),cv2.IMREAD_UNCHANGED)
           h,w=mainlogo.shape[:2]
           logo=cv2.resize(mainlogo,(120,int(h*(120/w))),interpolation=cv2.INTER_AREA)
           for eachfrr in RECORDED_DATA[1:]:
             try:
              bytess=base64.b64decode(eachfrr)
              npar=numpy.frombuffer(bytess,numpy.uint8)
              eachbyte=cv2.imdecode(npar,cv2.IMREAD_COLOR)
              if eachbyte is not None:
                 blend=cv2.addWeighted(eachbyte[20:20+logo.shape[0],20:20+logo.shape[1]],0.8,logo[:,:,:3],0.2,0)
                 eachbyte[20:20+logo.shape[0],20:20+logo.shape[1]][logo[:,:,3]>0]=blend[logo[:,:,3]>0]
                 mainvid.write(eachbyte)
             except Exception as err:
                FluxLog(err,level='warning')
                pass
           mainvid.release()

           AdminNotification(title='Video saved',body=f'Video saved to <span onclick="openDir(`{'Captures'}`)">Captures/</span><span button="open" onclick="{os.path.join(os.path.expanduser("~"),"Pictures","FluxLAN","Captures",f"Recording {str(LASTrecStamp.date())}_{str(LASTrecStamp.time()).replace(':','-')}.mp4")}">open</span>',timeout='never')

@S.on('hostpref') #dont use (to v1+)
def pref(com):
    FluxLog('System is using a beta function',level='error',CoverText=True)
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
   FluxLog(f"{data.get('user')} reported a battery change with the status : {data.get('status')}",KeyValues=True)
   if CloseWhenBattery:
      S.emit('CloseWhen',CloseWhenBattery)

@S.on('ClearAll')
def clear(e):
   S.emit('ClientClear','')
   FluxLog('Recieved signal to clear localstorage on all connected devices')

@S.on('ClearedAll')
def cleared(user):
   FluxLog(f"{user}'s localstorage was cleared.")
   S.emit('AdminCleared','')
   AdminNotification(title=f"{user}'s localstorage is being cleared",body=f"{user}'s saved preferences and usernames are being cleared",timeout=5,level='_info_')

@S.on('CloseSelf')
def close(ver):
   if(ver=='verified'):
    FluxLog('Closing FluxLAN',level='high',CoverText=True)
    AdminNotification(title='FluxLAN is closing',body='FluxLAN will be closed in a minute',timeout="never")
    S.emit('closing','normal')
    os.kill(os.getpid(),signal.SIGINT)

def MotionDetect():
      global MotionFrameLS,MotionDetecting,LASTFrame
      if MotionDetecting:
            if LASTFrame=="__not-found__":
               return
            header,base=LASTFrame.get('rec').split(',')
            temparr=numpy.frombuffer(base64.b64decode(base),numpy.uint8)
            eachfr=cv2.imdecode(temparr,cv2.IMREAD_GRAYSCALE)
            eachfr=cv2.resize(eachfr,(320,180))
            eachfr=cv2.GaussianBlur(eachfr,(7,7),0)
            if MotionFrameLS is None:
               MotionFrameLS=eachfr
            thrsh=cv2.threshold(cv2.absdiff(MotionFrameLS,eachfr),25,255,cv2.THRESH_BINARY)[1]
            contrs,_=cv2.findContours(thrsh,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
            
            for iN in contrs:
               if cv2.contourArea(iN) > 1200:#make ts adjustable
                  datetimeX=datetime.now()
                  #add hostnotiff if pref notifications secr
                  with open(f'{os.path.join(os.path.expanduser("~"),'Pictures','FluxLAN',"Motion detected",f"Capture {str(datetimeX.date())}_{str(datetimeX.time()).replace(':','-')}.jpg")}',"wb") as im:
                   im.write(base64.b64decode(base))        
                   FluxLog(f'Motion detected in {LASTFrame.get('camname')} at {datetimeX.time()}',CoverText=True)
                   AdminNotification(title=f'Motion detected in {LASTFrame.get('camname')}',body=f"""Motion detected in {LASTFrame.get('camname')}. Image captured <span onclick="openDir('Motion detected')">Captures/</span><span button="open" onclick="openS('Capture {str(datetimeX.date())}_{str(datetimeX.time()).replace(':','-')}','Motion detected')">open</span>""",timeout='5')
            MotionFrameLS=eachfr

@S.on('MotionDetection')
def command(data):
   global MotionDetecting,MotionFrameSkip,MotionFrameLS
   if data.get('command')=='start':
    FluxLog('Starting Motion detection')
    MotionDetecting=True
   elif data.get('command')=='stop':
    FluxLog('Stopping Motion detection')
    MotionDetecting=False
    MotionFrameLS=None
    MotionFrameSkip=0

@S.on('refresh')
def refresh(info):
   if info=='NetworkInfo':
      refreshNetworkInfo()
      return {"strength":NetworkStrength}

@S.on('exportdata')
def export(jsond):
   print('\n')
   FluxLog('Exporting data')
   #stackoverflow/a/14119223
   datetimeX=datetime.now()
   additionalinfo={
      "FLUXLAN":{
         "version":APP_VERSION,
         "version_release":APP_VERSION_RELEASE,
         "build":APP_BUILD,
         "release_date":APP_DATE
      },
      "Export_info":{
         "time_exported":f"{datetimeX.date()} {datetimeX.hour}:{datetimeX.minute}:{datetimeX.second}",
         "time_format":"YYYY-MM-DD HH:MM:SS"
      },
      "SessionData":{"ALLUSERS":ALLUSERS,"IP":MainIP,"Port":MainPort}
   }
   FluxLog('Writing system info to export')
   jsondata=json.loads(jsond)
   jsondata.update(additionalinfo)
   def saveExport():
    FluxLog('Opening file dialog to choose saving path')
    root.lift()
    root.attributes('-topmost',True)
    accepted=[('FluxLan backup files','*.fluxlan*')]
    saved=filedialog.asksaveasfile(filetypes=accepted,defaultextension='.fluxlan',title='Save export/backup file',initialfile=f"FluxLAN backup {datetimeX.date()}")
    root.update()
    root.withdraw()
    FluxLog('Closing file dialog')
    if saved:
       FluxLog('Saving export file')
       json.dump(jsondata,saved)
       saved.close()
   print('\n')
   tk_q.put(saveExport)

if not DEVELOPER_MODE:
 FluxLog('Opening dashboard')
 webbrowser.open(f'https://localhost:{MainPort}/dashboard')

@S.on('importdata')
   
def importpref():
 print('\n')
 FluxLog('Importing backup/export file')
 def openImport():
  FluxLog('Opening file dialog to choose what file import from')
  root.lift()
  root.attributes('-topmost',True)
  accepted=[('FluxLan backup files','*.fluxlan*')]
  imported=filedialog.askopenfilename(filetypes=accepted,title='Import export/backup file',defaultextension='.fluxlan')
  root.update()
  root.withdraw()
  FluxLog('Closing file dialog')
  if imported:
     FluxLog('Reading exported data')
     with open(imported,'r') as backup:
        backupd=json.load(backup)
        S.emit('recieveImport',backupd)
        FluxLog('Applying backup to current system')
 print('\n')
 tk_q.put(openImport) 

sys.excepthook=onerr   

def tk_qu():
       while not tk_q.empty():
          mainfunc=tk_q.get()
          mainfunc()
       root.after(10,tk_qu)

@S.on('ChangeBatteryStatus')
def change(status):
   global CloseWhenBattery
   CloseWhenBattery=status

if(__name__=="__main__"):
    MainServeThread=threading.Thread(
       target=lambda:S.run(main,debug=True,host='0.0.0.0',port=MainPort,ssl_context='adhoc',use_reloader=False),
       daemon=True,)
    MainServeThread.start()
    root.after(10,tk_qu)
    root.mainloop()
