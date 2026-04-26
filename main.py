from flask import Flask,request,render_template,abort
from flask_socketio import SocketIO,emit
import os
main=Flask(__name__,template_folder=os.path.join("templates"),static_folder=os.path.join("static"))

S=SocketIO(main,cors_allowed_origins="*")

ECHFRM='__not found__'
orientation='up'
@S.on('Process')
def mainroute(data):
   S.emit('Stream',data)
@main.route('/')
def web():
 return render_template('index.html')
@main.route('/dashboard')
def admin():
   if(request.remote_addr!='127.0.0.1'):
      abort(403)
      return 'sybau'
   return render_template('tromoSM-admin.html')

if(__name__=="__main__"):
    S.run(main,debug=True,host='0.0.0.0',port='84',ssl_context=('192.168.1.XX.pem', '192.168.1.XX-key.pem'))
