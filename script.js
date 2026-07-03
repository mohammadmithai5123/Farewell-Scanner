let scanner;

function startScanner() {

    document.getElementById("details").style.display = "none";

    document.getElementById("status").innerHTML = "Waiting for QR Scan...";
    document.getElementById("status").className = "waiting";

    scanner = new Html5Qrcode("reader");

    Html5Qrcode.getCameras().then(devices => {

        if (devices && devices.length) {

            scanner.start(

                {
                    facingMode: "environment"
                },

                {
                    fps: 10,
                    qrbox: {
                        width: 250,
                        height: 250
                    }
                },

                onScanSuccess

            );

        }

    }).catch(err => {

        alert("Camera Error : " + err);

    });

}

function onScanSuccess(decodedText) {

    scanner.stop();

    console.log("QR =", decodedText);

    verifyPass(decodedText);

}

function verifyPass(passNo){

    console.log(passNo);

    // API call yahan hogi

}

window.onload=function(){

startScanner();

}
