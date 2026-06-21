APP_RELEASE_TYPE='LITE'#lite or perf

import time
TIME_BEF_IMPORTS=time.perf_counter()
from flask import Flask,request,render_template,abort
from flask_socketio import SocketIO
import os
import sys
if sys.platform=='win32':
  from windows_toasts import AudioSource, Toast, ToastAudio,WindowsToaster
elif sys.platform=='darwin':
   try:
      from platform import mac_ver
   except:
      pass
elif sys.platform.startswith('linux'):
   try:
      from platform import freedesktop_os_release
   except:
      pass
import ctypes
import base64
from datetime import datetime
import subprocess
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
import cryptography #keep ts
import shutil
from platformdirs import user_data_dir
from pystray import Icon,Menu,MenuItem
from PIL import Image
from string import ascii_letters,digits
from random import choices
from platform import system,release
TIME_AFT_IMPORTS=time.perf_counter()

#cli modifications

CLI_MODIFIED=False
DEV_OPTIONS=True
DEVMODE_MODIFIED=False
DEVMODE_MODIFIED_STATE=False
DELAY_INFO_VERSION=False
DELAY_INFO_EXECTIME=False
PORT_MODIFIED=False
PORT_MODIFIED_STATE=False
FluxlanSource=os.path.basename(sys.argv[0])

for dynamicvar in sys.argv[1:]:
   if '=' in dynamicvar:
    tempstr=dynamicvar.split('=',1)[1].upper()
   else:
      tempstr=dynamicvar
   if dynamicvar.upper().startswith('SETMODE='):
      if tempstr in ('PERF','LITE'):
         ORIGINAL_RELEASE_TYPE=APP_RELEASE_TYPE
         APP_RELEASE_TYPE=tempstr
         CLI_MODIFIED=True
         print(f'| Changing release from {ORIGINAL_RELEASE_TYPE} to {APP_RELEASE_TYPE} [cli]')
      else:
         print('| setmode attributes must be "perf" or "lite" (case insensitive).')
   elif dynamicvar.upper().startswith('DEVMODE='):
      if tempstr in ('TRUE','FALSE'):
         DEVMODE_MODIFIED=True
         CLI_MODIFIED=True
         DEVMODE_MODIFIED_STATE=True if tempstr=='TRUE' else False
         print(f'| Turning developer mode {"on" if tempstr=="TRUE" else "off"} [cli]')
      else:
         print('| devmode attributes must be a bool. true or false (case insensitive).')
   elif dynamicvar.upper().startswith('SETPORT='):
      print('| Warning: some port numbers are reserved by other apps or your system.')
      if tempstr.isdigit():
         PORT_MODIFIED=True
         PORT_MODIFIED_STATE=tempstr
         CLI_MODIFIED=True
         print(f'| Port changed to {tempstr} (once) [cli]')
      else:
         print(f'| setport attributes must be a digit')

   elif dynamicvar in ('v','-v','version','Version','info','build','-info','-build'):
      DELAY_INFO_VERSION=True
   elif dynamicvar in ('ex','-ex','exectime','exctime','-exectime','exctime'):
      print('| Execution time will be logged after the app fully starts')
      DELAY_INFO_EXECTIME=True
   elif dynamicvar in ('-h','h','help','-help','/?','?','--help','--h'):
      print(
         f"""
USAGE:\n
 {FluxlanSource} [options] \n
OPTIONS :\n
 SETMODE=<perf|lite> (case insensitive)\n
    Change app mode to performance mode or lite mode.
    Examples : 
         {FluxlanSource} Setmode=perf
         {FluxlanSource} Setmode=lite\n
 DEVMODE=<true|false> (case insensitive)\n
    Change developer mode.
    Examples :
         {FluxlanSource} devmode=true
         {FluxlanSource} devmode=false\n
 -v, version, build, info\n 
    Display version and build info
    Examples :
         {FluxlanSource} -v
         {FluxlanSource} version\n
 -ex,exectime,exctime\n
    Measures the time the fluxlan took to load and displays the time
    Examples :
         {FluxlanSource} -ex
         {FluxlanSource} exectime
"""
      )
      sys.exit(0)
   else:
      print(f'"{dynamicvar}" is not an option')
      print('Unknown option:\n   Try `Fluxlan.exe -h` for more information.')
      sys.exit(0)
###

if APP_RELEASE_TYPE=='PERF':
   try:
    from webview import create_window,start,settings,FileDialog,errors
   except ModuleNotFoundError:
      print('┃ To use the performance release, Pywebview must be installed.')
      print('┗   `pip install pywebview` or download the performance release from github')

APP_VERSION='v0.9 pre'
APP_VERSION_RELEASE=0
APP_DATE='2026/05'
APP_UPDATECHK_ROOT='https://raw.githubusercontent.com/tromoSM/tromoSM-assets/main/repos/FLUXLAN/manifest.json'
APP_LINK_LOOKUP='https://raw.githubusercontent.com/tromoSM/tromoSM-assets/main/root/info.json'
APP_BUILD='beta'
APP_SUPPORT='https://tromosm.gt.tc/?feedback=true&utm_source=normal_fluxlan_console'
APP_SUPPORT_LTS_FEEDBACK="https://tromosm.github.io/tromoSM/t/?feedback=true&utm_source=lts_fluxlan_console_n_tray"
APP_ANALYTICS_LTS='https://tromosm.github.io/tromoSM-analytics/analytics/fluxlan'
APP_PRIVACY_POLICY_VERSION=4
APP_GITHUB='https://github.com/tromoSM/FluxLAN'
APP_PAGE_OTHR_PROJ="https://tromosm.github.io/tromoSM/t/?utm_source=flux_otherprojects_tray#project"
APP_REL_HASH='flxrelpre-09beta'
APP_THIRD_PARTY_LICENSES={"Flask":{"license":"BSD-3-Clause","version":"3.1.3"},"Flask-SocketIO":{"license":"MIT","version":"5.6.1"},"Werkzeug":{"license":"BSD-3-Clause","version":"3.1.8"},"Jinja2":{"license":"BSD","version":"3.1.6"},"NumPy":{"license":"BSD-3-Clause","version":"2.4.4"},"OpenCV":{"license":"Apache-2.0","version":"4.13.0.92"},"Requests":{"license":"Apache-2.0","version":"2.33.1"},"Pillow":{"license":"MIT-CMU","version":"12.2.0"},"Rich":{"license":"MIT","version":"15.0.0"},"Cryptography":{"license":"Apache-2.0 OR BSD-3-Clause","version":"48.0.0"},"qrcode":{"license":"BSD","version":"8.2"},"platformdirs":{"license":"MIT","version":"4.9.6"},"pystray":{"license":"LGPLv3","version":"0.19.5"},"pywebview":{"license":"BSD","version":"6.2.1"},"Socket.IO":{"license":"MIT"},"Lottie":{"license":"MIT"}}
APP_TOS_VERSION=1


MAINUSERSDI={}
ALLUSERS=[]
RECORDED_DATA=[]

DEVELOPER_MODE=True
USETRAYICON=True
ALLOWUNSAFEDASHBOARD=False 

if DEVMODE_MODIFIED:
   DEVELOPER_MODE=DEVMODE_MODIFIED_STATE

LASTFrame='__not-found__'
orientation='up'
RecordingRunning=False
CurrentRecordStream=False
LASTrecStamp=None
MotionDetecting=False
MotionFrameSkip=0
MotionFrameLS=None
MainIP='unavailable'
MainPort='3113'
Protocol='unavailable'
CloseWhenBattery=0 #v1+. val will chng
LastMotionDetected=0
MotionCooldown=10
opener="open" if sys.platform == "darwin" else "xdg-open"
FirstTime=False
WelcomePageOpened=False
ConsoleON=DEVELOPER_MODE
ConsoleToggleFeature=not sys.platform.startswith('linux')
OSsupport='unavailable'
UnsupportedFeatures=''
NetworkRefreshCount=0
NetworkStrength=''
OS_version='unavailable'

TIME_AFT_STARTUP=time.perf_counter()

if PORT_MODIFIED:
   ORIGINAL_PORT=MainPort
   MainPort=PORT_MODIFIED_STATE
   print(f'| Port was changed from {ORIGINAL_PORT} to {MainPort} [cli]')

if DELAY_INFO_VERSION:
   print(f"""
 Main : {APP_VERSION} ({APP_DATE})
 Build : {APP_VERSION}/{APP_VERSION_RELEASE}({APP_RELEASE_TYPE}/{APP_BUILD}) {APP_DATE} {"{"}{APP_REL_HASH}{"}"}
 Legal : tos({APP_TOS_VERSION}) privacy policy({APP_PRIVACY_POLICY_VERSION}) 
 CLI : modified={CLI_MODIFIED} devmode modified={DEVMODE_MODIFIED}
 Additional info : imports=({int(TIME_AFT_IMPORTS-TIME_BEF_IMPORTS)}s/{TIME_AFT_IMPORTS-TIME_BEF_IMPORTS})
""")
   sys.exit(0)

try:
 if not DEVELOPER_MODE:
  if sys.platform=='win32':
   kernel=ctypes.WinDLL('kernel32')
   user=ctypes.WinDLL('user32')
   if kernel.GetConsoleWindow():
    user.ShowWindow(kernel.GetConsoleWindow(),0)
except:
   pass
APPROOT=user_data_dir(appauthor='tromoSM',appname='FluxLAN')
VERSION_DATA=os.path.join(APPROOT,'version.version')

main=Flask(__name__,template_folder=os.path.join(APPROOT,"templates"),static_folder=os.path.join(APPROOT,"static"))

S=SocketIO(main,cors_allowed_origins="*",async_mode='threading')

if APP_RELEASE_TYPE=="PERF":
       MainWindow=create_window(url=f"https://localhost:{MainPort}/dashboard",resizable=True,text_select=True,title='FluxLAN',min_size=(722,453),background_color='#FFFFFF')

SystemFolders=["Captures","Motion detected","FluxLAN"]
AllowedExt=['jpg','mp4','log','png','fluxlan']
FluxLanFilelist=[
   'admin.js','main.js','socket.io.min.js','main.css','InterVar.css','MaterialSymbolsRounded-VariableFont_FILL,GRAD,opsz,wght.ttf',
   'favicon.png','favicon-l.png','logo-w.png','logo.png','logo.svg',
   'index.html','tromoSM-admin.html'
]

root = tk.Tk()
root.withdraw()
tk_q=queue.Queue()

platform=sys.platform
if platform=='win32':
   OSsupport='Full compatibility'
   UnsupportedFeatures='None'
elif platform=='darwin':
   OSsupport='Most features'
   UnsupportedFeatures='network strength measuring, debug console(limited)'
elif platform.startswith('linux'):
   OSsupport='Core features'
   UnsupportedFeatures='network strength measuring, debug console(toggle)'

#OS VERSION
def OS_VERSION():
 global OS_version
 if platform=='win32':
   winversion=sys.getwindowsversion()
   WinName='unavailable'
   oldwin={(5,1):"XP",(6.0):"Vista",(6,1):"7",(6,2):"8",(6,3):"8.1"}
   if(winversion.major,winversion.minor) in oldwin:
      WinName=f"Windows {oldwin.get((winversion.major,winversion.minor))}"
   elif winversion.major==10:
      if winversion.build<22000:
         WinName='Windows 10'
      else:
         WinName='Windows 11'
   OS_version=WinName
 elif platform=='darwin':
   try:
      #stackoverflow/a/16981403 Posted by Abeltang
      if mac_ver()[0]!='': # pyright: ignore[reportUndefinedVariable]
         OS_version=mac_ver()[0] # pyright: ignore[reportUndefinedVariable]
      else:
         OS_version='mac_rel_failed' #couldnt find release
   except:
      OS_version='Darwin'
      
 elif platform.startswith('linux'):
    try:
       OS_version=freedesktop_os_release()["PRETTY_NAME"] # pyright: ignore[reportUndefinedVariable]  
    except OSError:
      OS_version='cant_read_rel'
    except:
      OS_version='Linux'

#Logging
if DEVELOPER_MODE:
 APP_REL_HASH=''.join(choices(ascii_letters+digits,k=10))
#stackoverflow/a/2257449 Posted by Ignacio Vazquez-Abrams

FlaskLog=logging.getLogger('werkzeug')
FlaskLog.setLevel(logging.WARNING)
if APP_RELEASE_TYPE=='PERF':
   PerfLog=logging.getLogger('pywebview')
   PerfLog.setLevel(logging.WARNING)

FluxLanLog=logging.getLogger(__name__)
logging.basicConfig(handlers=[RichHandler(rich_tracebacks=True,show_level=False,show_path=False,show_time=False,markup=True,highlighter=NullHighlighter())],format='%(message)s',level=logging.INFO)

def FluxLog(message,level='info',padding=1,CoverText=False,KeyValues=False,KeyValPadding=False,insidepadding=1):
   colortable={'info':'bright_blue','error':'red',"high":'bright_red','debug':'magenta','warning':'yellow','dev':'bright_green'}
   if not CoverText and not KeyValues:
    message=f"[{colortable.get(level)}]|[/{colortable.get(level)}]{" "*insidepadding}{message}"
   elif not KeyValues:
    message=f"[{colortable.get(level)}]|{" "*insidepadding}{message}[/{colortable.get(level)}]"
   if KeyValues:
      colored=message.split(':',1)
      message=f"[{colortable.get(level)}]|{" "*insidepadding}{colored[0]}:[/{colortable.get(level)}]{colored[1]}"
   if KeyValPadding:
      keyval=message.split(':',1)
      message=f"{keyval[0]}\n{(" "*7)+keyval[1]}"

   Loglevel={"info":FluxLanLog.info,"error":FluxLanLog.error,'high':FluxLanLog.info,'debug':FluxLanLog.debug,'warning':FluxLanLog.warning,'dev':FluxLanLog.warning}
   
   LogFunc=Loglevel.get(level)
   LogFunc(f'{" "*padding}{message}') 

#TRAYICON
if sys.platform=='win32':
 kernel=ctypes.WinDLL('kernel32')
 user=ctypes.WinDLL('user32')

def refreshConsole():  
 # add sys windows and fallback
 if sys.platform=='win32':
  if kernel.GetConsoleWindow():
   user.ShowWindow(kernel.GetConsoleWindow(),5 if ConsoleON else 0)
 elif sys.platform=='darwin':
   try:
    subprocess.Popen(
       f"""osascript -e 'tell application "System Events" to set visible of process "Terminal" to {'true' if ConsoleON else 'false'}'""",
       shell=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE
    )
   except Exception as er:
      FluxLog(er,level='error')

def ConsoleState(icon,item):
   global ConsoleON
   ConsoleON=not ConsoleON
   refreshConsole()
refreshConsole()

def AllowUnsafeDashboard(i,ic):
   global ALLOWUNSAFEDASHBOARD
   ALLOWUNSAFEDASHBOARD=not ALLOWUNSAFEDASHBOARD
      
def CloseSelf(ver):
   if(ver=='verified'):
    FluxLog('Closing FluxLAN',level='high',CoverText=True)
    AdminNotification(title='FluxLAN is closing',body='FluxLAN will be closed in a minute',timeout="never")
    S.emit('closing','normal')
    os.kill(os.getpid(),signal.SIGINT)

def refreshPage(starter='/dashboard',params=None,newTab=True):
   locations={"?linkcam=true":'/link_camera',"?checkupdate=true":'check_update/','':'dashboard/',None:'dashboard/'}
   uri=f'https://localhost:{MainPort}{starter}{params if params else ''}'
   if APP_RELEASE_TYPE=='PERF':
      MainWindow.load_url(uri)
      FluxLog(f'refreshing page location to {locations.get(params)}')
   elif APP_RELEASE_TYPE=='LITE':
      if newTab:
         webbrowser.open_new_tab(uri)
      else:
         webbrowser.open(uri)
      FluxLog(f'Opening {locations.get(params)}')

def StartTray():
            imicon=Image.open(os.path.join(APPROOT,'static','Assets','icon-w.ico'))
            menu=Menu(
               MenuItem(f'𝗙𝗹𝘂𝘅𝗟𝗔𝗡 - {APP_VERSION}',None,enabled=False),
               Menu.SEPARATOR,
               MenuItem('Open dashboard',lambda item,icon:
                        refreshPage()
                        ),
               MenuItem('Link device',lambda it,ic:refreshPage(params='?linkcam=true',newTab=False)),
               Menu.SEPARATOR,
               MenuItem('Debug console',ConsoleState,checked=lambda item:ConsoleON,enabled=ConsoleToggleFeature),
               MenuItem('Advanced',Menu(
                  MenuItem('Advanced info',
                     Menu(
                     MenuItem(f'Local ip : {MainIP}',None,enabled=False),
                     MenuItem(f'Running on : port {MainPort}',None,enabled=False),
                     MenuItem(f'Appdata path : {APPROOT}',None,enabled=False),
                     Menu.SEPARATOR,
                     MenuItem(f'Version : {APP_VERSION} ({APP_DATE}/{APP_BUILD})',None,enabled=False),
                     MenuItem(f'Release type : {'performance'if APP_RELEASE_TYPE=='PERF'else 'lite'}',None,enabled=False),
                     MenuItem(f'Developer mode : {DEVELOPER_MODE}',None,enabled=False),
                     MenuItem(f'Modified via cli : {CLI_MODIFIED}',None,enabled=False),
                     Menu.SEPARATOR,
                     MenuItem(f'OS compatibility : {OSsupport}',None,enabled=False),
                     MenuItem(f'Unsupported features on {sys.platform}: {UnsupportedFeatures}',None,enabled=False),
                  )),
                  MenuItem('Developer options',Menu(
                     MenuItem("Allow other devices to access dashboard",AllowUnsafeDashboard,checked=lambda item:ALLOWUNSAFEDASHBOARD)
                  ))
               ),
                  ),
               MenuItem('Support/Contact us',Menu(
                  MenuItem('Github',lambda it,ic:webbrowser.open_new_tab(APP_GITHUB)),
                  MenuItem('Other projects from developer',lambda it,ic: webbrowser.open_new_tab(APP_PAGE_OTHR_PROJ)),
                  MenuItem('Feedback and request features',lambda it,ic:webbrowser.open_new_tab(APP_SUPPORT)),
                  MenuItem('Contact by email',lambda it,ic:webbrowser.open_new_tab('mailto:tromosm7@gmail.com'))
               )),
               Menu.SEPARATOR,
               MenuItem('Check for updates',lambda it,ic:refreshPage(params='?checkupdate=true',newTab=False)),
               MenuItem('Close Fluxlan',lambda it,ic:CloseSelf('verified'))
            )
            icon=Icon('FluxLAN',imicon,'FluxLAN',menu=menu)
            icon.run()
#STARTUP 
try:

 terminalsize=os.get_terminal_size()
 terminalwidth=terminalsize.columns
except Exception as er:
   terminalwidth=106
   FluxLog(er,level='error')

if(terminalwidth>=(107+len(APP_VERSION))):
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
TIME_AFT_CONSOLE=time.perf_counter()
if DEVELOPER_MODE:
   FluxLog(f"Release type : {APP_RELEASE_TYPE}",KeyValues=True,level='dev')
   FluxLog('Running in developer mode',level='high')
   FluxLog(f'Developer Mode: Using random REL_HASH. Will replace appdata everytime {'{'+APP_REL_HASH+'}'}',level='dev',KeyValues=True)
   FluxLog(f'Startup Took {int(TIME_AFT_CONSOLE-TIME_BEF_IMPORTS)}s')
   if APP_RELEASE_TYPE=='PERF':
      FluxLog(f'LocalStorage Path : {os.path.join(APPROOT,"prefr")}',KeyValues=True,level='dev')
def refreshNetworkInfo():
 global NetworkStrength,NetworkRefreshCount
 if sys.platform=='win32':
  #stackoverflow/a/39463881
  try:
   NetworkStrength=''
   tempbytes=subprocess.check_output(["netsh","wlan","show","network","mode=Bssid"],text=True)
   for line in tempbytes.split('\n'):
     if "Signal" in line:
        signal=int(line.split(':')[1].strip().replace('%',''))
        dBm=(signal//2)-100
        NetworkStrength={"signal":signal,"dBm":dBm}
        break
   if NetworkStrength=='':
        connected=subprocess.check_output(["netsh","wlan","show","interfaces"],text=True,stderr=subprocess.DEVNULL)
        if 'State'in connected and 'connected' in connected.lower():
         NetworkStrength={"signal":'0%',"dBm":"N/A "}
         FluxLog(f'NetworkStrength returned : {line}',level='error',KeyValues=True)
        else:
          FluxLog("Using Ethernet: can't refresh network strength",KeyValues=True)
          NetworkStrength={'signal':'ethernet','dBm':'N/A '}

  except Exception as ex:
   FluxLog(f'Error in network info {ex}',level='error')
   NetworkStrength={"signal":'error',"dBm":"N/A "}
 else:
   FluxLog('Limited support : only windows support network strength measuring yet.',level='warning')
   NetworkStrength={"signal":'unsupported os',"dBm":'only windows support this yet'}
 FluxLog(f"Refreshing network info {'(refreshed by advanced tab)'if NetworkRefreshCount!=0 else ''}: signal {NetworkStrength.get('signal')} dBm {NetworkStrength.get('dBm')}dBm ",level='info',CoverText=True,KeyValues=True)
 NetworkRefreshCount+=1

refreshNetworkInfo()

def linkLookup():
   global APP_SUPPORT
   try:
      mainRes=requests.get(url=APP_SUPPORT,timeout=5,headers={"User-Agent":"Mozilla/5.0"})
      if mainRes.status_code==200:
         pass
      else :
         APP_SUPPORT=APP_SUPPORT_LTS_FEEDBACK
         FluxLog(f'Main support site is returning {mainRes.status_code} : using fallback site',level='warning',KeyValues=True)
   except requests.exceptions.ConnectionError as er:
         APP_SUPPORT=APP_SUPPORT_LTS_FEEDBACK
         FluxLog(f'Main support site is not responding : using fallback site',level='warning',KeyValues=True)

linkLookup()
# FIRST TIME
if not os.path.exists(os.path.join(os.path.expanduser("~"),'Pictures','FluxLAN')):
    os.makedirs(os.path.join(os.path.expanduser("~"),'Pictures','FluxLAN'))
    FirstTime=True
    FluxLog('First time running : Creating media folders',KeyValues=True)

if not os.path.exists(os.path.join(os.path.expanduser("~"),'Pictures','FluxLAN','Captures')):
    os.makedirs(os.path.join(os.path.expanduser("~"),'Pictures','FluxLAN',"Captures"))

if not os.path.exists(os.path.join(os.path.expanduser("~"),'Pictures','FluxLAN',"Motion detected")):
    os.makedirs(os.path.join(os.path.expanduser("~"),'Pictures','FluxLAN',"Motion detected"))

os.makedirs(os.path.join(APPROOT,'prefr'),exist_ok=True)

if FirstTime:
   OS_VERSION()
if(DEVELOPER_MODE):
   FluxLog(f'Appdata folder : {APPROOT}',KeyValues=True)
os.makedirs(APPROOT,exist_ok=True)
def meipasspath():
   if getattr(sys,'frozen',False):
      return sys._MEIPASS
   return os.path.dirname(os.path.abspath(__file__))
def returnMovedVer():
   if not os.path.exists(VERSION_DATA):
      return None
   else:
      with open(VERSION_DATA,'r') as ver:
         return ver.read().strip()
def updatedir(new,old):
   if os.path.exists(old):
      try:
       shutil.rmtree(old)
      except PermissionError as er:
         for file in os.listdir(old):
          if file not in FluxLanFilelist:
             try:
                os.remove(os.path.join(old,file))
             except Exception as ex:
                FluxLog(ex,level='error',CoverText=True)
                continue
         FluxLog(f'Access is denied : {er}',level='error')
   shutil.copytree(new,old,dirs_exist_ok=True)

if returnMovedVer()!=f'{APP_VERSION}${APP_REL_HASH}':
 if(returnMovedVer() is not None):
  FluxLog(f'New version detected : {'{'}{returnMovedVer().split('$')[0]} -> {APP_VERSION}{' (devmode)'if returnMovedVer().split('$')[0]==APP_VERSION else ''}{'}'} updating cached files.',KeyValues=True)
 else:
    FluxLog('New installation detected. Caching files')
 updatedir(os.path.join(meipasspath(),'static'),os.path.join(APPROOT,'static'))
 updatedir(os.path.join(meipasspath(),'templates'),os.path.join(APPROOT,'templates'))
 with open(VERSION_DATA,'w') as ver:
    ver.write(f'{APP_VERSION}${APP_REL_HASH}')

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
        try:
         ALLUSERS.remove(user)
        except Exception as err:
         FluxLog(f'Error in leave event : {err}',KeyValues=True,level='error')          
    S.emit('adminLEAVE',user)  
    S.emit('CAMlist',ALLUSERS)  

def AdminNotification(title='',body='',icon='__none__',timeout=4,level='info'):
   S.emit('AdminNotification',{'title':title,"body":body,"icon":icon,"timeout":timeout,"level":level})
def UserError(user,title,description): # DONT USE YET
   S.emit('notification',{"user":user,"title":title,'description':description}) #change to S.to SID

def HostNotification(title,description,fallbackicon=0x40):
   #use icon.notify in v1+
   if DEVELOPER_MODE:
    FluxLog('Remove return from HostNotification',level='error',CoverText=True)
   return
   if(sys.platform=='win32'):
       try:
        maintk=WindowsToaster("FluxLAN")
        toast=Toast()
        toast.text_fields=[title,description]
        toast.audio=ToastAudio(AudioSource.Default, looping=0)
        maintk.show_toast(toast)
       except Exception as ex:
          ctypes.windll.user32.MessageBoxW(0,f"{title.upper()}\n{'￣'*(int(len(description)/2))}\n{description}","FluxLAN",fallbackicon)
          FluxLog(f'Limited support - Windows version might be less than 10. Exception : {ex}',level='warning',CoverText=True)
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
      if data.get("stream")==int(CurrentRecordStream):
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
    MAINUSERSDI[request.sid]=dih.get('clieUSR')
    curuser=MAINUSERSDI.get(request.sid,request.sid)
    joinev(curuser)

@S.on('disconnect')
def left(reason):
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
      return {'date':APP_DATE,'updatechk_root':APP_UPDATECHK_ROOT,'version':APP_VERSION,'version_release':str(APP_VERSION_RELEASE),'link_lookup':APP_LINK_LOOKUP,'build':APP_BUILD,"ip":MainIP,'port':MainPort,'protocol':Protocol,"strength":NetworkStrength,"release_type":"performance" if APP_RELEASE_TYPE=='PERF' else "lite"}
   elif q=='qr':
      return {"qr": MainQR,"link":f"https://{MainIP}:{MainPort}"}
   elif q=='pp':
      return {"version":APP_PRIVACY_POLICY_VERSION}
   elif q=='legal':
      return {"thirdPartyLicense":APP_THIRD_PARTY_LICENSES,'tos':APP_TOS_VERSION}
@S.on('OpenFolder')
def openF(fl):
    if sys.platform=='win32':
       if fl=='user/Pictures/app':
        os.startfile(os.path.join(os.path.expanduser("~"),'Pictures','FluxLAN'))
        FluxLog(f'Opening {os.path.join(os.path.expanduser("~"),"Pictures","FluxLAN")}')
    else:
       FluxLog(f'Couldnt execute function : FluxLAN do not fully support {sys.platform} yet. Report issue : {APP_SUPPORT}',level='error',KeyValues=True)        

@main.route('/')
def web():
 global Protocol
 if Protocol=='unavailable':
  Protocol=request.scheme

 return render_template('index.html')

@main.route('/dashboard')
def admin():
   global Protocol,WelcomePageOpened
   if Protocol=='unavailable':
    Protocol=request.scheme

   if(request.remote_addr not in ['127.0.0.1','::1'] ) :
    if not ALLOWUNSAFEDASHBOARD:
      FluxLog(f'{request.remote_addr} is trying to access the dashboard.',level='warning',CoverText=True)
      FluxLog(f'Dashboard is forbidden to IPs other than 127.0.0.1 or localhost. Use localhost:{MainPort} or 127.0.0.1:{MainPort} instead.',level='warning',CoverText=True)
      FluxLog('To access the dashboard from other devices, Go to : System tray -> advanced -> developer options -> Allow other devices to access to dashboard.',level='warning',KeyValues=True,KeyValPadding=True)
      abort(403)
      return 'sybau'
    else:
      FluxLog(f'DEV : Dashboard is being accessed by {request.remote_addr}',level='dev',KeyValues=True)

   if FirstTime:
    if not WelcomePageOpened:
     webbrowser.open_new_tab(f"{APP_ANALYTICS_LTS}?v={APP_VERSION}&r={APP_BUILD}&p={OS_version}_{sys.platform}&o={MainPort}&t={"performance"if APP_RELEASE_TYPE=='PERF' else "lite"}")
     WelcomePageOpened=True
     
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
 fileExt=data.get('filetype')
 if folder not in SystemFolders or str(fileExt).lower() not in AllowedExt:
    FluxLog(f'Open folder blocked : {folder} is not a Fluxlan accessed folder.',level='warning',KeyValues=True)
    if DEVELOPER_MODE:
       FluxLog(f'Add {folder} to system folders')
    return
 if sys.platform=='win32':
   try:
    subprocess.Popen([
      "explorer","/select,",f'{os.path.normpath(os.path.join(os.path.expanduser("~"),"Pictures","FluxLAN",folder,f"{path}.{fileExt}"))}'
    ],stderr=subprocess.PIPE,stdout=subprocess.PIPE) 
   except Exception as err:
    FluxLog(f'Couldnt execute function : {err}',level='error',KeyValues=True)
 else: 
   #stackoverflow/a/17317468 # Posted by user4815162342
   subprocess.call([opener,os.path.join(os.path.expanduser("~"),"Pictures","FluxLAN",folder,f"{path}.{fileExt}")])
   FluxLog(f'Some of the features might not work. FluxLan doesnt fully support {sys.platform} yet. Report issue : {APP_SUPPORT}',level='warning',KeyValues=True)        
 FluxLog(f'Opening {os.path.normpath(os.path.join(os.path.expanduser("~"),"Pictures","FluxLAN",folder,f"{path}.{fileExt}"))}')

@S.on('OpenDir')
def openD(path):
    if path not in SystemFolders:
     FluxLog(f'Open folder blocked : {path} is not a Fluxlan accessed folder.',level='warning',KeyValues=True)
     if DEVELOPER_MODE:
       FluxLog(f'Add {path} to system folders',level='high')
     return
    if sys.platform=='win32':
     os.startfile(os.path.join(os.path.expanduser("~"),"Pictures","FluxLAN",path))
    else:
      #stackoverflow/a/17317468 # Posted by user4815162342
      subprocess.call([opener,os.path.join(os.path.expanduser("~"),"Pictures","FluxLAN",path)])
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
           FluxLog(f'Stopping recording : {len(RECORDED_DATA)} frames found',KeyValues=True)
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
            except Exception as err:
               FluxLog(f"Error in recording : {err}",level='error',CoverText=True)
           if firstfr is None:
              FluxLog('No frames found',level='error')
              return
           recheight,recwidth=firstfr.shape[:2]
           saved=os.path.join(os.path.expanduser("~"),"Pictures","FluxLAN","Captures",f"Recording {str(LASTrecStamp.date())}_{str(LASTrecStamp.time()).replace(':','-')}.mp4")
           mainencd=cv2.VideoWriter_fourcc(*'mp4v')
           mainvid=cv2.VideoWriter(saved,mainencd,30,(recwidth,recheight))
           mainvid.write(firstfr)
           mainlogo=cv2.imread(os.path.join(APPROOT,'static','Assets','logo-w.png'),cv2.IMREAD_UNCHANGED)
           h,w=mainlogo.shape[:2]
           logo=cv2.resize(mainlogo,(120,int(h*(120/w))),interpolation=cv2.INTER_AREA)
           writing=False
           for eachfrr in RECORDED_DATA[1:]:
             try:
              bytess=base64.b64decode(eachfrr)
              npar=numpy.frombuffer(bytess,numpy.uint8)
              eachbyte=cv2.imdecode(npar,cv2.IMREAD_COLOR)
              if eachbyte is not None:
                 blend=cv2.addWeighted(eachbyte[20:20+logo.shape[0],20:20+logo.shape[1]],0.8,logo[:,:,:3],0.2,0)
                 eachbyte[20:20+logo.shape[0],20:20+logo.shape[1]][logo[:,:,3]>0]=blend[logo[:,:,3]>0]
                 mainvid.write(eachbyte)
                 if not writing:
                    FluxLog('Writing recorded data to file')
                    writing=True
              else: 
               FluxLog('recording data not found',level='error')
             except Exception as err:
                FluxLog(err,level='warning')
                pass
           writing=False
           mainvid.release()
           FluxLog(f'Recording saved to : {saved}',KeyValues=True)
           AdminNotification(title=f'Recording saved',body=f"""Recording saved to <span onclick="openDir('Captures')">Captures/</span><span button="open" onclick="openS('Recording {str(LASTrecStamp.date())}_{str(LASTrecStamp.time()).replace(':','-')}','Captures','mp4')">open</span>""",timeout='5')

@S.on('hostpref') #dont use (to v1+)
def pref(com):
    FluxLog('System is using a beta function',level='error',CoverText=True)
    prefr=com.get("pref")
    with open(os.path.normpath(os.path.join(APPROOT,'preferences.json')),'r') as pref:
     saved=json.load(pref)
    command=com.get('command')
    if command=='get':
        saved.get(prefr)
    elif command=='set':
      saved.append({str(prefr):str(com.get('value'))})
      with open(os.path.normpath(os.path.join(APPROOT,'preferences.json')),'w') as pref:
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
   FluxLog('Received signal to clear localstorage on all connected devices')

@S.on('ClearedAll')
def cleared(user):
   FluxLog(f"{user}'s localstorage was cleared.")
   S.emit('AdminCleared','')
   AdminNotification(title=f"{user}'s localstorage is being cleared",body=f"{user}'s saved preferences and usernames are being cleared",timeout=5,level='_info_')

@S.on('CloseSelf')
def close(ver):
   CloseSelf(ver)

def MotionDetect():
      global MotionFrameLS,MotionDetecting,LASTFrame
      if MotionDetecting:
            if LASTFrame=="__not-found__" or not LASTFrame.get('rec'):
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
                  global LastMotionDetected
                  datetimeX=datetime.now()
                  #add hostnotiff if pref notifications secr v1+
                  currtime=time.time()
                  if currtime-LastMotionDetected<MotionCooldown:
                     return
                  
                  with open(f"{os.path.join(os.path.expanduser('~'),'Pictures','FluxLAN','Motion detected',f"Capture {str(datetimeX.date())}_{str(datetimeX.time()).replace(':','-')}.jpg")}","wb") as im:
                   im.write(base64.b64decode(base))        
                   FluxLog(f"Motion detected in {LASTFrame.get('camname')} at {datetimeX.time()}",CoverText=True)
                   AdminNotification(title=f'Motion detected in {LASTFrame.get("camname")}',body=f"""Motion detected in {LASTFrame.get('camname')}. Image captured <span onclick="openDir('Motion detected')">Captures/</span><span button="open" onclick="openS('Capture {str(datetimeX.date())}_{str(datetimeX.time()).replace(':','-')}','Motion detected','jpg')">open</span>""",timeout='5')
                   LastMotionDetected=currtime
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
   global NetworkStrength
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
    if APP_RELEASE_TYPE!='PERF':
     root.lift()
     root.attributes('-topmost',True)
    accepted=[('FluxLan backup files','*.fluxlan*')]
    webviewaccepted=("FluxLan backup files (*.fluxlan)",)
    if APP_RELEASE_TYPE=="PERF":
      FluxLog('Using webview file dialog',CoverText=True)
      saved=MainWindow.create_file_dialog(
         FileDialog.SAVE,save_filename=f"FluxLAN backup {datetimeX.date()}",file_types=webviewaccepted
      )   
    else:
     saved=filedialog.asksaveasfile(filetypes=accepted,defaultextension='.fluxlan',title='Save export/backup file',initialfile=f"FluxLAN backup {datetimeX.date()}")
     root.update()
     root.withdraw()
    FluxLog('Closing file dialog')
    if saved:
       FluxLog('Saving export file')
       if APP_RELEASE_TYPE!='PERF':
        json.dump(jsondata,saved)
        saved.close()
       else:
          with open(saved[0],"w") as export:
             json.dump(jsondata,export)
          
   print('\n')
   if APP_RELEASE_TYPE!='PERF':
    tk_q.put(saveExport)
   else:
      saveExport()

if not DEVELOPER_MODE:
 FluxLog('Opening dashboard')    
 webbrowser.open(f'https://localhost:{MainPort}/dashboard')

@S.on('importdata')
   
def importpref():
 print('\n')
 FluxLog('Importing backup/export file')
 def openImport():
  FluxLog('Opening file dialog to choose what file import from')
  accepted=[('FluxLan backup files','*.fluxlan*')]
  webviewaccepted=("FluxLan backup files (*.fluxlan)",)
  if APP_RELEASE_TYPE!='PERF':
   root.lift()
   root.attributes('-topmost',True)
   imported=filedialog.askopenfilename(filetypes=accepted,title='Import export/backup file',defaultextension='.fluxlan')
   root.update()
   root.withdraw()
  else:
     imported=MainWindow.create_file_dialog(
        FileDialog.OPEN,file_types=webviewaccepted
     )
  FluxLog('Closing file dialog')
  if imported:
     FluxLog('Reading exported data')
     if APP_RELEASE_TYPE!="PERF":
      with open(imported,'r') as backup:
        try:
         backupd=json.load(backup)
         S.emit('recieveImport',backupd)
        except json.JSONDecodeError as er:
         FluxLog(f'Cannot decode backup file. file may be corruped : {er}',level='error',KeyValPadding=True,KeyValues=True)
     else:
        with open(imported[0],'r') as backup:
         backupd=json.load(backup)
         S.emit('recieveImport',backupd)
     FluxLog('Applying backup to current system')
 print('\n')
 if APP_RELEASE_TYPE!='PERF':
  tk_q.put(openImport) 
 else:
    openImport()


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
    TIME_BEF_FULLSTART=time.perf_counter()
    if DELAY_INFO_EXECTIME: #exec arg
       FluxLog('===EXECTIME===',CoverText=True)
       FluxLog(f'Imports : {int(TIME_AFT_IMPORTS-TIME_BEF_IMPORTS)}s',KeyValues=True,insidepadding=2)
       FluxLog(f'Args/dynamic : {int(TIME_AFT_STARTUP-TIME_BEF_IMPORTS)}s',KeyValues=True,insidepadding=2)
       FluxLog(f'Startup : {int(TIME_AFT_CONSOLE-TIME_BEF_IMPORTS)}s',KeyValues=True,insidepadding=2)
       FluxLog(f'Fullstart : {int(TIME_BEF_FULLSTART-TIME_BEF_IMPORTS)}s',KeyValues=True,insidepadding=2)
       FluxLog(f'After start : {int(TIME_BEF_FULLSTART-TIME_AFT_STARTUP)}s',KeyValues=True,insidepadding=2)

    MainServeThread=threading.Thread(
       target=lambda:S.run(main,debug=DEVELOPER_MODE,host='0.0.0.0',port=int(MainPort),ssl_context='adhoc',use_reloader=False),
       daemon=True)

    if USETRAYICON:
        threading.Thread(target=StartTray,daemon=True).start()
    MainServeThread.start()
    if APP_RELEASE_TYPE=="PERF":
       settings["IGNORE_SSL_ERRORS"]=True
       def webclose():
          CloseSelf('verified')
       def webidentify():
         try:
          MainWindow.evaluate_js('window.USING_WEBVIEW=true',callback=None)
         except errors.WebViewException as err:
            FluxLog(f'Failed to add watermark : {err}',level='error',KeyValues=True)
       MainWindow.events.closing+=webclose
       start(webidentify,private_mode=False,storage_path=os.path.join(APPROOT,"prefr"),debug=DEVELOPER_MODE)

    root.after(10,tk_qu)
    root.mainloop()
