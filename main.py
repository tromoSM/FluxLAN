from flask import Flask,request,render_template,abort
from flask_socketio import SocketIO,emit
import os
main=Flask(__name__,template_folder=os.path.join("templates"),static_folder=os.path.join("static"))
MAINUSERSDI={}
ALLUSERS=[] #keep this
S=SocketIO(main,cors_allowed_origins="*")
LASTFrame='__not-found__'
orientation='up'

# GLOBAL UI FUNCc
def joinev(user):
    if user not in ALLUSERS:
     ALLUSERS.append(user)
    else:
       #emtIOerrUSR
       pass
    S.emit('adminJOIN',user)      

def leaveev(user):
    if user in ALLUSERS:
        ALLUSERS.remove(user)
    S.emit('adminLEAVE',user)  

def UserError(user,title,description): # DONT USE YET
   S.emit('notification',{"user":user,"title":title,'description':description}) #change to S.to SID
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
if(__name__=="__main__"):
    S.run(main,debug=True,host='0.0.0.0',port='84',ssl_context=('192.168.1.XX.pem', '192.168.1.XX-key.pem'))
