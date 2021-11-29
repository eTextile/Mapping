
async function onConnectButtonClick() {
    if ('serial' in navigator) {
        try {
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: 230400 });
        this.reader = port.readable.getReader();
        this.writer = port.writable.getWriter();
        }
        catch (err) {
            console.error('There was an error opening the serial port:', err);
        }
    }
    else {
        console.error('The Web serial API doesn\'t seem to be enabled in your browser.');
    }
}
/*
// Read the port data
port.on("open", () => {
    console.log('serial port open');
});

parser.on('data', data =>{
    console.log('got word from arduino:', data);
});
*/