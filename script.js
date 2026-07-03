const beep = new Audio("sounds/beep-02.mp3");
beep.preload = "auto";



const API_URL = "https://script.google.com/macros/s/AKfycbxGOpMUdZMdSh9B_8ZA3eUv8ERMca4y3uY60nb_cN8m_185DLKfT4pgN_K95-nRZfj8/exec";

let scanner;

function startScanner() {

    document.getElementById("details").style.display = "none";

    document.getElementById("status").innerHTML = "Waiting for QR Scan...";
    document.getElementById("status").className = "waiting";

    scanner = new Html5Qrcode("reader");

    Html5Qrcode.getCameras().then(devices => {

        if (devices.length) {

            scanner.start(

                { facingMode: "environment" },

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

        alert(err);

    });

}

async function onScanSuccess(decodedText) {

    await scanner.stop();

    console.log(decodedText);

    // QR contains:
    // PASS:FW-XXXX|REG:...|NAME:...

    let passNo = decodedText;

    if (decodedText.startsWith("PASS:")) {

        passNo = decodedText.split("|")[0].replace("PASS:", "").trim();

    }

    verifyPass(passNo);

}

function verifyPass(passNo) {

    fetch(API_URL + "?pass=" + encodeURIComponent(passNo))

    .then(res => res.json())

    .then(data => {

        console.log(data);

        showResult(data);

    })

    .catch(err => {

        alert(err);

        startScanner();

    });

}

function showResult(data){

    const status=document.getElementById("status");

    const details=document.getElementById("details");

    details.style.display="block";

    if(data.success){

        status.className="success";

        status.innerHTML="✅ ENTRY ALLOWED";

        details.innerHTML=`
        <h2>${data.name}</h2>
        <p><b>Reg:</b> ${data.reg}</p>
        <p><b>Section:</b> ${data.section}</p>
        <p><b>Pass:</b> ${data.pass}</p>
        `;

    }

    else if(data.type=="duplicate"){

        status.className="duplicate";

        status.innerHTML="🔴 ALREADY ENTERED";

        details.innerHTML=`
        <h2>${data.name}</h2>
        <p><b>Reg:</b> ${data.reg}</p>
        <p><b>Section:</b> ${data.section}</p>
        <p><b>First Entry:</b> ${data.firstEntry}</p>
        `;

    }

    else if(data.type=="payment"){

        status.className="payment";

        status.innerHTML="🟠 PAYMENT NOT VERIFIED";

        details.innerHTML="";

    }

    else{

        status.className="invalid";

        status.innerHTML="❌ INVALID PASS";

        details.innerHTML="";

    }

    if(navigator.vibrate){
        navigator.vibrate(300);
    }

    setTimeout(function(){

        details.style.display="none";

        startScanner();

    },3000);

}

window.onload=function(){

    startScanner();

}
