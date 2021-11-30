// https://editor.p5js.org/lemio/sketches/fOBD_hn-4

var val1 = 0;
var val2 = 0;
//Define the elements
let sendText = document.getElementById("sendText");
let sendButton = document.getElementById("sendButton");
let receiveText = document.getElementById("receiveText");
let connectButton = document.getElementById("connectButton");
let statusBar = document.getElementById("statusBar");

//Couple the elements to the Events
connectButton.addEventListener("click", clickConnect)
sendButton.addEventListener("click", clickSend)

//When the connectButton is pressed
async function clickConnect() {
  if (port) {
    //if already connected, disconnect
    disconnect();

  } else {
    //otherwise connect
    await connect();
  }
}

//Define outputstream, inputstream and port so they can be used throughout the sketch
var outputStream, inputStream, port, serialReader;
navigator.serial.addEventListener('connect', e => {
  statusBar.innerText = `Connected to $ {e.port}`;
  connectButton.innerText = "Disconnect"
});

navigator.serial.addEventListener('disconnect', e => {
  statusBar.innerText = `Disconnected`;
  connectButton.innerText = "Connect"
});
//Connect to the Arduino
async function connect() {
  disconnect()
  //Optional filter to only see relevant boards
  const filter = {
    usbVendorId: 0x2341 // Arduino SA
  };

  //Try to connect to the Serial port
  try {
    port = await navigator.serial.requestPort(/*{ filters: [filter] }*/);
    // Continue connecting to |port|.

    // - Wait for the port to open.
    await port.open({ baudrate: 9600 });

    statusBar.innerText = "Connected";
    connectButton.innerText = "Disconnect"
    let decoder = new TextDecoderStream();
    inputDone = port.readable.pipeTo(decoder.writable);
    inputStream = decoder.readable;

    const encoder = new TextEncoderStream();
    outputDone = encoder.readable.pipeTo(port.writable);
    outputStream = encoder.writable;

    serialReader = inputStream.getReader();
    readLoop();
  } catch (e) {

    //If the pipeTo error appears; clarify the problem by giving suggestions.
    if (e == "TypeError: Cannot read property 'pipeTo' of undefined") {
      e += "\n Use Google Chrome and enable-experimental-web-platform-features"
    }
    if (e == "TypeError: Failed to execute 'requestPort' on 'Serial': 1 argument required, but only 0 present.") {
      e += "\n Use Google Chrome and enable-experimental-web-platform-features"
    }
    if (e == "NetworkError: Failed to open serial port.") {
      e += "Try unplugging the Arduino and connect again"
    }
    disconnect()
    connectButton.innerText = "Connect"
    statusBar.innerText = e;
  }
}
//Write to the Serial port
async function writeToStream(line) {
  const writer = outputStream.getWriter();
  writer.write(line);
  writer.releaseLock();
}

//Disconnect from the Serial port
async function disconnect() {

  if (serialReader) {
    await serialReader.cancel();
    await inputDone.catch(() => { });
    serialReader = null;
    inputDone = null;
  }
  if (outputStream) {
    await outputStream.getWriter().close();
    await outputDone;
    outputStream = null;
    outputDone = null;
  }
  statusBar.innerText = "Disconnected";
  connectButton.innerText = "Connect"
  //Close the port.
  await port.close();
  port = null;
}

//When the send button is pressed
function clickSend() {
  //send the message
  writeToStream(sendText.value)
  //and clear the input field, so it's clear it has been sent
  sendText.value = "";

}

//Read the incoming data
async function readLoop() {
  while (true) {
    const { value, done } = await serialReader.read();
    if (done === true) {
      break;
    }
    //When recieved something add it to the big textarea
    receiveText.value += value;
    serialString = receiveText.value;
    //Scroll to the bottom of the text field
    var patt = new RegExp( / ([0 - 9] {1, 6}), ([0 - 9] {1, 6})\n / m);
    var res = patt.exec(serialString);
    if (res != null) {
      serialString = serialString.replace(patt, ""); //"["+res[1]+", "+res[2]+"]");
      val1 = res[1];
      val2 = res[2];
    }
    receiveText.value = serialString;
    receiveText.scrollTop = receiveText.scrollHeight;
  }
}