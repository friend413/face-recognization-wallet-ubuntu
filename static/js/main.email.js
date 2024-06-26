let inputSize = 512
let scoreThreshold = 0.5
var processingMode = 0
var backendprocessing = 0
var processingStartTime = 0
var processingCount = 0
var livenssCount = 0
var prevRecogName = 0
var prevLiveness = 0
var lv
var selctedItem = -1
var customerId = ''
var userList
const ENROLL_TIMEOUT = 15
const VERIFY_TIMEOUT = 15
const SERVER_ADDR = 'https://sandbox.anonid.io'
const validemails ["varun.chintalapati@duke.edu","e.kim@duke.edu","aldo.oyadomari@duke.edu","nicolas.kudrna@duke.edu","ina.jain@duke.edu","linh.nguyen@duke.edu","Enkhhulan.enkhbold@duke.edu","ria.singh@duke.edu","fmaure@duke.edu","nikhil.kashyap@duke.edu","Jo166@duke.edu"];

renderjson.set_show_to_level(3);

function getCurrentFaceDetectionNet() {
  return faceapi.nets.tinyFaceDetector
}

function isFaceDetectionModelLoaded() {
  return !!getCurrentFaceDetectionNet().params
}

function getFaceDetectorOptions() {
  return new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold })
}

function removeSelectedUser(custId) {
  if(selctedItem < 0) {
    return
  }

  Swal.fire({
      title: 'Remove User',
      text: "Are you sure to remove this user?",
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: "Ok"
    }).then((result) => {
      if (result.value) {
	customerId = custId
        console.log('selected ' + userList[selctedItem])
        requestRemoveUser(userList[selctedItem])              
      }
    })
}

function clearUsers(custId) {
  Swal.fire({
    title: 'Remove All User',
    text: "Are you sure to remove all user?",
    icon: 'info',
    showCancelButton: true,
    confirmButtonText: "Ok"
  }).then((result) => {
    if (result.value) {
      customerId = custId
      requestRemoveAll()
    }
  })
}

function processingDone() {
  processingMode = 0
  backendprocessing = 0;

  const canvas = $('#overlay').get(0)
  const context = canvas.getContext('2d')
  context.clearRect(0, 0, 800, 600)

  const videoEl = $('#inputVideo').get(0)
  videoEl.srcObject = null
}

async function processingStart(mode) {
  processingMode = mode
  backendprocessing = 1
  processingCount = 0
  livenssCount = 0
  prevRecogName = ''
  prevLiveness = 0
  processingStartTime = new Date().getTime() / 1000

  // try to access users webcam and stream the images
  // to the video element
  const stream = await navigator.mediaDevices.getUserMedia({ video: {} })
  const videoEl = $('#inputVideo').get(0)
  videoEl.srcObject = stream

  document.getElementById('result_text1').innerText = ''
  document.getElementById('result_text2').innerText = ''
}

async function enrollUser(custId) {  
  console.log('enroll user ' + processingMode)
  if(processingMode > 0) {
    return
  }

  const { value: username } = await Swal.fire({
    title: 'Enter eMail',
    input: 'text',
    inputPlaceholder: 'Enter your name',
    allowOutsideClick: true,
    inputValidator: (value) => {
      if (!value) {
        return 'You must enter the email used to purchase conference ticket!'
      }
    }
  })

  if(username) {
    console.log("enroll user name: " + username)

console.log("SAURAV: Validate email with valid emails")
	  let length = validemails.length;

    customerId = custId

    if (validemails.includes(username) {
    
    enrollUserName = username
    processingStart(1)
    } else {
    // clear drawings when no detection
	     console.log("Not Found");
    
  }
}

function verifyUser(custId) {
  if(processingMode > 0) {
    return
  }

  customerId = custId
  console.log(">>>>>>>>>>>>>customer id is ", customerId)
  processingStart(2)
}

async function verifyUserwithName() {
  if(processingMode > 0) {
    return
  }

  const { value: username } = await Swal.fire({
    title: 'Verify User',
    input: 'text',
    inputPlaceholder: 'Enter your name',
    allowOutsideClick: true,
    inputValidator: (value) => {
      if (!value) {
        return 'You need to write something!'
      }
    }
  })

  if(username) {
    verifyUserName = username
    processingStart(3)
  }
}

function removeUser(custId) {
  if(processingMode > 0) {
    return
  }

  customerId = custId
  console.log(">>>>>>>>>>>>>customer id is ", customerId)
  processingStart(4)
}


async function onPlay() {
  const videoEl = $('#inputVideo').get(0)

  if (videoEl.paused || videoEl.ended || !isFaceDetectionModelLoaded())
    return setTimeout(() => onPlay())

  const options = getFaceDetectorOptions()
  const result = await faceapi.detectSingleFace(videoEl, options)
  
  const canvas = $('#overlay').get(0)
  console.log('on play')

  let curTime = new Date().getTime() / 1000;
  if(processingMode == 1 && curTime - processingStartTime > ENROLL_TIMEOUT) {
    processingDone()

    new PNotify({
      type: 'fail',
      text: 'Enroll Timeout. Please try again.'
    })

  } else if(processingMode == 2 && curTime - processingStartTime > VERIFY_TIMEOUT) {
    processingDone()

    new PNotify({
      type: 'fail',
      text: 'Verify Timeout. Please try again.'
    })
    enrollUser()

  } else if(processingMode == 3 && curTime - processingStartTime > VERIFY_TIMEOUT) {
    processingDone()

    new PNotify({
      type: 'fail',
      text: 'Verify Timeout. Please try again.'
    })

  } else if (processingMode == 4 && curTime - processingStartTime > VERIFY_TIMEOUT) {
    processingDone()

    new PNotify({
      type: 'fail',
      text: 'Opting Out Timeout. Please try again.'
    })

  } else if (result) {

    const dims = faceapi.matchDimensions(canvas, videoEl, true)
    if(dims.width == 0)
      return
    const resizedResult = faceapi.resizeResults(result, dims)

    let label = ''
    let boxColor = 'green'
    const options = { label, boxColor }
    const drawBox = new faceapi.draw.DrawBox(resizedResult.box, options)
    drawBox.draw(canvas)

    //////////////////////////////////////////
    if(backendprocessing == 1) {
      console.log("<<<<<<<<<<<< backend processing")
      backendprocessing = 2;
    
      var canvasCapture = $('#capture').get(0)
      canvasCapture.width = videoEl.videoWidth
      canvasCapture.height = videoEl.videoHeight
      var contextCapture = canvasCapture.getContext('2d')
      contextCapture.drawImage(videoEl, 0, 0, videoEl.videoWidth, videoEl.videoHeight)
      var image = canvasCapture.toDataURL('image/jpg');

      if(processingMode == 1) {
          requestEnroll(image, enrollUserName)
      } else if(processingMode == 2) {
          requestVerify(image)
      } else if (processingMode == 3) {
          requestVerifywithName(image, verifyUserName)
      } else if (processingMode == 4) {
	  requestRemoveUserByFace(image)    
      }
    }

    //////////////////////////////////////////
  } else {
    // clear drawings when no detection
    const context = canvas.getContext('2d')
    context.clearRect(0, 0, canvas.width, canvas.height)
  }

  setTimeout(() => onPlay())
}

function load() {

}

async function run() {

  var animation = bodymovin.loadAnimation({
    container: document.getElementById('face_ani'),
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: 'static/data/data.json'
  })

  if (!isFaceDetectionModelLoaded()) {
    await getCurrentFaceDetectionNet().load('static/js/weights')
  }
}

$(document).ready(function () {
var list = document.getElementById("userlist");
list.addEventListener('click', function(ev) {
  if (ev.target.tagName === 'LI') {
    for(i = 0; i < list.children.length; i++)
      if(ev.target == list.children[i])
        selctedItem = i
      else
        list.children[i].classList.remove('checked')
    ev.target.classList.add('checked');
  }
}, false);

  requestUserList()

  setTimeout(() => {
    run()
  }, 3000);
})

function requestVerify(photo) {
  var url = SERVER_ADDR + "/verify_user";

  var xhr = new XMLHttpRequest();
  xhr.open("POST", url);

  xhr.setRequestHeader("Accept", "application/json");
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      console.log(xhr.status);
      console.log(xhr.responseText);
      if (xhr.status == 200) {
        try {
          res = JSON.parse(xhr.responseText)
          if (res.status == 'Verify OK') {
            if(prevRecogName == res.name && prevLiveness > 0.8 && res.liveness > 0.8) {
              console.log(">>>>>>>>>>>> processing verify time ",  new Date().getTime() / 1000)
              //location.replace("https://www.casinosoftusa.com/");
              processingDone()
	      if(res.admin == '1') {
		document.getElementById("user-list-toggle").classList.remove("hidden");
                document.getElementById("ocr-data-toggle").classList.remove("hidden");
	      }
              new PNotify({
              type: 'success',
              text: res.name + ' verified!'
              })
            // close();
            } else {
	      console.log(">>>>>>>>>> processing first time ", new Date().getTime() / 1000, res.name)
              prevRecogName = res.name
              prevLiveness = res.liveness
              backendprocessing = 1
              processingStartTime = new Date().getTime() / 1000
              processingCount ++
            }
          } else if (res.status == 'Move Closer'){
            document.getElementById('result_text1').innerText = 'Go'
            document.getElementById('result_text1').style.color = 'red'
            document.getElementById('result_text2').innerText = 'Closer!'
            document.getElementById('result_text2').style.color = 'red'

            prevRecogName = ''
            prevLiveness = 0
            processingCount = 0
            backendprocessing = 1
            processingStartTime = new Date().getTime() / 1000
            processingCount ++
          } else if (res.status == 'Go Back'){
            document.getElementById('result_text1').innerText = 'Go'
            document.getElementById('result_text1').style.color = 'red'
            document.getElementById('result_text2').innerText = 'Back!'
            document.getElementById('result_text2').style.color = 'red'

            prevRecogName = ''
            prevLiveness = 0
            processingCount = 0
            backendprocessing = 1
            processingStartTime = new Date().getTime() / 1000
            processingCount ++
          } else if(res.status == 'No Users') {
            new PNotify({
              type: 'fail',
              text: 'No users. Please register users first.'
            })

            processingDone()
            enrollUser()
          } else {
            document.getElementById('result_text1').innerText = ''
            document.getElementById('result_text1').style.color = 'red'
            document.getElementById('result_text2').innerText = ''
            document.getElementById('result_text2').style.color = 'red'

            prevRecogName = ''
            prevLiveness = 0
            backendprocessing = 1
            processingStartTime = new Date().getTime() / 1000
            processingCount ++
          }
        } catch (e) {
          prevRecogName = ''
          prevLiveness = 0
          backendprocessing = 1
          processingStartTime = new Date().getTime() / 1000
          processingCount ++
        }
      } else {
        prevRecogName = ''
        prevLiveness = 0
        backendprocessing = 1
        processingStartTime = new Date().getTime() / 1000
        processingCount ++
      }
    }

    if(processingCount >= 10) {
      processingDone()
      if(prevRecogName != '') {
        new PNotify({
          type: 'fail',
          text: 'Liveness Check Failed. Please try again.'
        })
        enrollUser()

        document.getElementById('result_text1').innerText = 'You are'
        document.getElementById('result_text1').style.color = 'black'
        document.getElementById('result_text2').innerText = 'spoof. (' + res.name + ')'
        document.getElementById('result_text2').style.color = 'red'

      } else {
        new PNotify({
          type: 'fail',
          text: 'Verify Failed. Please try again.'
        })
        enrollUser()

        document.getElementById('result_text1').innerText = 'Verify'
        document.getElementById('result_text1').style.color = 'red'
        document.getElementById('result_text2').innerText = 'Failed'
        document.getElementById('result_text2').style.color = 'red'
      }
    }
  };

  var data = `{
    "image": "` + photo + `",
    "customer": "` + customerId + `"
  }`;

  xhr.send(data);
}

function requestVerifywithName(photo, name) {
  var url = SERVER_ADDR + "/verify_user_with_name";

  var xhr = new XMLHttpRequest();
  xhr.open("POST", url);

  xhr.setRequestHeader("Accept", "application/json");
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      console.log(xhr.status);
      console.log(xhr.responseText);
      if (xhr.status == 200) {
        try {
          res = JSON.parse(xhr.responseText)
          if (res.status == 'Verify OK') {
            if(prevRecogName == res.name && prevLiveness > 0.8 && res.liveness > 0.8) {
              document.getElementById('result_text1').innerText = 'Welcome'
              document.getElementById('result_text1').style.color = 'black'
              document.getElementById('result_text2').innerText = res.name
              document.getElementById('result_text2').style.color = 'red'
              processingDone()

              new PNotify({
                type: 'success',
                text: res.name + ' verified!'
              })
            } else {
              prevRecogName = res.name
              prevLiveness = res.liveness
              backendprocessing = 1
              processingStartTime = new Date().getTime() / 1000
              processingCount ++
            }
          } else if (res.status == 'Move Closer'){
            document.getElementById('result_text1').innerText = 'Go'
            document.getElementById('result_text1').style.color = 'red'
            document.getElementById('result_text2').innerText = 'Closer!'
            document.getElementById('result_text2').style.color = 'red'

            prevRecogName = ''
            prevLiveness = 0
            processingCount = 0
            backendprocessing = 1
            processingStartTime = new Date().getTime() / 1000
            processingCount ++
          } else if (res.status == 'Go Back'){
            document.getElementById('result_text1').innerText = 'Go'
            document.getElementById('result_text1').style.color = 'red'
            document.getElementById('result_text2').innerText = 'Back!'
            document.getElementById('result_text2').style.color = 'red'

            prevRecogName = ''
            prevLiveness = 0
            processingCount = 0
            backendprocessing = 1
            processingStartTime = new Date().getTime() / 1000
            processingCount ++
          } else if(res.status == 'No Users') {
            new PNotify({
              type: 'fail',
              text: 'No users. Please register users first.'
            })

            processingDone()
          } else {
            document.getElementById('result_text1').innerText = ''
            document.getElementById('result_text1').style.color = 'red'
            document.getElementById('result_text2').innerText = ''
            document.getElementById('result_text2').style.color = 'red'

            prevRecogName = ''
            prevLiveness = 0
            backendprocessing = 1
            processingStartTime = new Date().getTime() / 1000
            processingCount ++
          }
        } catch (e) {
          prevRecogName = ''
          prevLiveness = 0
          backendprocessing = 1
          processingStartTime = new Date().getTime() / 1000
          processingCount ++
        }
      } else {
        prevRecogName = ''
        prevLiveness = 0
        backendprocessing = 1
        processingStartTime = new Date().getTime() / 1000
        processingCount ++
      }
    }

    if(processingCount >= 10) {
      processingDone()
      if(prevRecogName != '') {
        new PNotify({
          type: 'fail',
          text: 'Liveness Check Failed. Please try again.'
        })

        document.getElementById('result_text1').innerText = 'You are'
        document.getElementById('result_text1').style.color = 'black'
        document.getElementById('result_text2').innerText = 'spoof. (' + res.name + ')'
        document.getElementById('result_text2').style.color = 'red'

      } else {
        new PNotify({
          type: 'fail',
          text: 'Verify Failed. Please try again.'
        })

        document.getElementById('result_text1').innerText = 'Verify'
        document.getElementById('result_text1').style.color = 'red'
        document.getElementById('result_text2').innerText = 'Failed'
        document.getElementById('result_text2').style.color = 'red'
      }
    }
  };

  var data = `{
    "name": "` + name + `", 
    "image": "` + photo + `"
  }`;

  xhr.send(data);
}


function requestRemoveUser(name) {
  var url = SERVER_ADDR + "/remove_user";

  var xhr = new XMLHttpRequest();
  xhr.open("POST", url);

  xhr.setRequestHeader("Accept", "application/json");
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      console.log(xhr.status);
      console.log(xhr.responseText);
      if (xhr.status == 200) {
        try {
          res = JSON.parse(xhr.responseText)
          if (res.status == 'OK') {
            new PNotify({
              type: 'success',
              text: name + ' removed!'
            })
          }

          requestUserList()
        } catch (e) { }
      } else {
        new PNotify({
          type: 'fail',
          text: 'Failed to remove user.'
        })
      }
    }
  };

  var data = `{
    "name": "` + name + `"
    "customer": "` + customerId + `"
  }`;

  xhr.send(data);
}

function requestRemoveUserByFace(photo) {
  var url = SERVER_ADDR + "/remove_user_by_face";

  var xhr = new XMLHttpRequest();
  xhr.open("POST", url);

  xhr.setRequestHeader("Accept", "application/json");
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      console.log(xhr.status);
      console.log(xhr.responseText);
      if (xhr.status == 200) {
        try {
          res = JSON.parse(xhr.responseText)
          if (res.status == 'Removed Face') {
            processingDone()
            new PNotify({
              type: 'success',
              text: name + 'User Removed!'
            })
          } else if (res.status == 'No Face') {
	    processingDone()
	    new PNotify({
	      type: 'fail',
	      text: 'Not Enrolled'
	    })
	  } else if (res.status == 'Admin') {
            processingDone()
            new PNotify({
              type: 'fail',
              text: 'Removal Restricted'
            })
          }
	  else {
            processingStartTime = new Date().getTime() / 1000
	    processingCount ++
	  }
        } catch (e) {
	    processingStartTime = new Date().getTime() / 1000
	    processingCount ++
	}
      } else {
	    processingStartTime = new Date().getTime() / 1000
            processingCount ++
      }
    }
     if (processingCount >= 10) {
	    processingDone()
	    new PNotify({
            type: 'fail',
            text: 'Removal Failed. Please try again.'
        })

        document.getElementById('result_text1').innerText = 'Verify'
        document.getElementById('result_text1').style.color = 'red'
        document.getElementById('result_text2').innerText = 'Failed'
        document.getElementById('result_text2').style.color = 'red'
     }
  };

  var data = `{
    "image": "` + photo + `",
    "customer": "` + customerId + `"
  }`;

  xhr.send(data);
}


function requestRemoveAll() {
  var url = SERVER_ADDR + "/remove_all";

  var xhr = new XMLHttpRequest();
  xhr.open("POST", url);

  xhr.setRequestHeader("Accept", "application/json");
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      console.log(xhr.status);
      console.log(xhr.responseText);
      if (xhr.status == 200) {
        try {
          res = JSON.parse(xhr.responseText)
          if (res.status == 'OK') {
            new PNotify({
              type: 'success',
              text: 'All users removed!'
            })

            requestUserList()
          }
        } catch (e) { }
      } else {
        new PNotify({
          type: 'fail',
          text: 'Something went wrong. Please try again.'
        })
      }
    }
  };

  var data = `{
    "customer": "` + customerId + `"
  }`;

  xhr.send(data);
}

function requestUserList() {
  var ul = document.getElementById("userlist");
  while (ul.firstChild) {
      ul.removeChild(ul.firstChild);
  }
  selctedItem = -1

  var url = SERVER_ADDR + "/user_list";
  var xhr = new XMLHttpRequest();
  xhr.open("POST", url);

  xhr.setRequestHeader("Accept", "application/json");
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      console.log(xhr.status);
      console.log(xhr.responseText);
      if (xhr.status == 200) {
        try {
          res = JSON.parse(xhr.responseText)
          if(res.status == 'OK') {
            for(i = 0; i < res.users.length; i ++) {
              var li = document.createElement("li");
              var t = document.createTextNode(res.users[i]);
              li.appendChild(t)
              ul.appendChild(li)
            }
            userList = res.users
          }
        } catch (e) { }
      } else {
      }
    }
  };

  xhr.send('{}');
}

function requestEnroll(photo, name) {
  var url = SERVER_ADDR + "/enroll_user";

  var xhr = new XMLHttpRequest();
  xhr.open("POST", url);

  xhr.setRequestHeader("Accept", "application/json");
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      console.log(xhr.status);
      console.log(xhr.responseText);
      if (xhr.status == 200) {
        res = JSON.parse(xhr.responseText)
        if (res.status == 'Enroll OK') {
          backendprocessing = 0
          processingMode = 0
          const videoEl = $('#inputVideo').get(0)
          videoEl.srcObject = null

          document.getElementById('result_text1').innerText = name
          document.getElementById('result_text1').style.color = 'red'
          document.getElementById('result_text2').innerText = 'enrolled!'
          document.getElementById('result_text2').style.color = 'black'

          requestUserList()
          new PNotify({
            type: 'success',
            text: name + ' enrolled!'
          })
        } else if (res.status == 'Already Exist') {
          backendprocessing = 0
          processingMode = 0
          const videoEl = $('#inputVideo').get(0)
          videoEl.srcObject = null

          document.getElementById('result_text1').innerText = 'Sorry user already  (' + res.name + ')'
          document.getElementById('result_text1').style.color = 'red'
          document.getElementById('result_text2').innerText = 'Exist!'
          document.getElementById('result_text2').style.color = 'black'


          requestUserList()
          new PNotify({
            type: 'fail',
            text: 'Sorry user already exist!'
          })
        } else if(res.status == 'Move Closer') {
          document.getElementById('result_text1').innerText = 'Go'
          document.getElementById('result_text1').style.color = 'red'
          document.getElementById('result_text2').innerText = 'Closer!'
          document.getElementById('result_text2').style.color = 'red'

          backendprocessing = 1
          processingStartTime = new Date().getTime() / 1000
        } else if(res.status == 'Go Back') {
          document.getElementById('result_text1').innerText = 'Go'
          document.getElementById('result_text1').style.color = 'red'
          document.getElementById('result_text2').innerText = 'Back!'
          document.getElementById('result_text2').style.color = 'red'

          backendprocessing = 1
          processingStartTime = new Date().getTime() / 1000
        } else if(res.status == 'Liveness Failed') {
          livenssCount ++
          document.getElementById('result_text1').innerText = 'Liveness'
          document.getElementById('result_text1').style.color = 'red'
          document.getElementById('result_text2').innerText = 'Failed!'
          document.getElementById('result_text2').style.color = 'red'

          backendprocessing = 1
        } else {
          backendprocessing = 1

          document.getElementById('result_text1').innerText = ''
          document.getElementById('result_text1').style.color = 'red'
          document.getElementById('result_text2').innerText = ''
          document.getElementById('result_text2').style.color = 'red'
        }
      } else {
        backendprocessing = 1
      }
    }
  };

  var data = `{
    "name": "` + name + `", 
    "image": "` + photo + `",
    "customer": "` + customerId + `"
  }`;

  xhr.send(data);
}

function idocr()
{
    var str1 = document.getElementById('uploadFile').value;
    var ext1 = str1.substring(str1.length - 3, str1.length).toString();
    var extext1 = ext1.toLowerCase();

    if (extext1 === "jpg" || extext1 === "peg" || extext1 === "png") {
        if (event.target.files && event.target.files[0]) {            
            requestAPI_localFile(event.target.files[0])
        }
    }
    else {
    }
}

function requestAPI_localFile(img)
{
    $("#loader1").show();
    document.getElementById('id_img').src = URL.createObjectURL(img);
    let formData = new FormData();
    formData.append("image1", img);

    var url = SERVER_ADDR + '/ocr/idcard';
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    xhr.onreadystatechange = function () {
        $("#loader1").hide();
        console.log(xhr.readyState);
        if (xhr.readyState === 4) {
            if(xhr.status === 200) {
                 var jsondata = JSON.parse(xhr.responseText);
                console.log("json: " + xhr.responseText);

                title = 'Information';
                icon = 'info';
                if (jsondata['status'] == 'Verify Failed') {
                    title = 'Error';
                    icon = 'error';
                }

                const json_node = document.getElementById("json-output")
                while (json_node.firstChild) {
                    json_node.firstChild.remove()
                }
                json_node.appendChild(
                    renderjson(jsondata)
                );
            }
        }
    };

    xhr.send(formData);
}
