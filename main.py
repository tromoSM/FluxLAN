from flask import Flask,jsonify,request,render_template,abort
import os
main=Flask(__name__,template_folder=os.path.join("templates"),static_folder=os.path.join("static"))

ECHFRM='__not found__'
orientation='up'
@main.route('/process',methods=['POST'])
def mainroute():
    global ECHFRM,orientation
    mainA=request.get_json()
    a=mainA.get('rec')
    orientation=mainA.get('ori')
    print(a)
    ECHFRM=a
    return jsonify({'status':'success','recieved':a}),200
@main.route('/')
def web():
 return render_template('index.html')
@main.route('/dashboard')
def admin():
   if(request.remote_addr!='127.0.0.1'):
      abort(403)
      return 'sybau'
   return render_template('tromoSM-admin.html')
@main.route('/stream')
def stream():
   global ECHFRM,orientation
   return jsonify({'rec':ECHFRM,"ori":orientation})
if(__name__=="__main__"):
    main.run(debug=True,host='0.0.0.0',port='84',ssl_context=('192.168.1.XX.pem', '192.168.1.XX-key.pem'))
