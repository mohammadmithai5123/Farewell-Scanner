const beep = new Audio("sounds/beep-02.mp3");
beep.preload = "auto";

// Ensure the browser allows audio playback by unlocking audio on first user gesture.
// Many browsers block autoplay with sound until the user interacts with the page.
let audioUnlocked = false;

function unlockAudio() {
    if (audioUnlocked) return;

    // Try a quick play/pause to grant permission for future plays
    beep.play().then(() => {
        beep.pause();
        beep.currentTime = 0;
        audioUnlocked = true;
        console.log('Audio unlocked');
    }).catch(err => {
        // NotAllowedError will be thrown if the browser still blocks it.
        console.warn('Audio unlock failed:', err);
    });

    // Also attempt to resume an AudioContext if present (some browsers gate audio via AudioContext)
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
            const ctx = new AudioCtx();
            if (ctx.state === 'suspended') {
                ctx.resume().then(() => console.log('AudioContext resumed')).catch(() => {});
            }
        }
    } catch (e) {
        // ignore
    }

    // Remove listeners after first interaction
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('touchstart', unlockAudio);
}

// Attach listeners so a single user tap/click unlocks audio for the session
document.addEventListener('click', unlockAudio);
document.addEventListener('touchstart', unlockAudio);

const API_URL = "https://script.google.com/macros/s/AKfycbxGOpMUdZMdSh9B_8ZA3eUv8ERMca4y3uY60nb_cN8m_185DLKfT4pgN_K95-nRZfj8/exec";

let scanner;

function startScanner() {

    document.getElementById("details").style.display = "none";

    document.getElementById("status").innerHTML = "Waiting for QR Scan...";
    document.getElementById("status").className = "waiting";

    scanner = new Html5Qrcode("reader");

    Html5Qrcode.getCameras().then(devices => {

        console.log('Cameras found:', devices);

        if (devices && devices.length) {
            // Prefer a device ID (more reliable than constraints object)
            const cameraId = devices[0].id || devices[0].deviceId || devices[0].label;

            // Safety: if cameraId is missing, fallback to facingMode constraint
            const cameraArg = cameraId ? cameraId : { facingMode: "environment" };

            try {
                scanner.start(
                    cameraArg,
                    {
                        fps: 10,
                        qrbox: {
                            width: 250,
                            height: 250
                        }
                    },
                    onScanSuccess,
                    (errorMessage) => {
                        // QR Code scan failure callback (called for each scan attempt that fails)
                        // We log it for debugging but don't interrupt the scanner
                        // console.debug('QR Scan error:', errorMessage);
                    }
                ).catch(err => {
                    console.error('Scanner start failed:', err);
                    alert('Could not start camera: ' + err);
                });
            } catch (e) {
                console.error('Error calling scanner.start:', e);
                alert('Scanner initialization error: ' + e);
            }

        } else {
            alert('No cameras found');
        }

    }).catch(err => {

        console.error('getCameras() error:', err);
        alert('Camera access error: ' + err);

    });

}

async function onScanSuccess(decodedText) {

    try {
        await scanner.stop();
    } catch (e) {
        console.warn('Error stopping scanner after success:', e);
    }

    console.log('QR decoded:', decodedText);

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

        console.error('verifyPass error:', err);

        alert(err);

        startScanner();

    });

}

function showResult(data){

    // reset to start so the beep plays from the beginning
    try {
        beep.currentTime = 0;
        beep.play().catch(err => console.log("Audio Error:", err));
    } catch (e) {
        console.log('Audio play/reset error:', e);
    }

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
