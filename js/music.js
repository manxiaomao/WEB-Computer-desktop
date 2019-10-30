window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;
    var playlist = document.getElementById("playlist"),
        fileInput = document.getElementById("file"),
        right = document.getElementById("right"),
        left = document.getElementById("left"),
        prevBtn = document.getElementById("prev"),
        playBtn = document.getElementById("play"),
        nextBtn = document.getElementById("next"),
        logo = document.getElementById("logo"),
        volume = document.getElementById("volume"),
        files = [], 
		ac = new AudioContext(), gainNode, source, analyser, size, w = 15, step = 5,
        currIndex = 0, status = 0, caps = [], idx = 0,
        canvas = document.getElementById("canvas"),
        c = canvas.getContext("2d");
    window.onresize = window.onload = resize;
    function resize() {
        playlist.style.height = window.innerHeight - 190 + "px";
        W = canvas.width = window.innerWidth - left.offsetWidth;
        H = canvas.height = window.innerHeight;
        size = Math.ceil(W / (32 * (w + step))) * 32;
        var g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "red");
        g.addColorStop(.5, "yellow");
        g.addColorStop(1, "green");
        c.fillStyle = g;
        addCaps();
    }
    function prev() {
        removeClass(playlist.getElementsByTagName("li")[currIndex], "active");
        if (currIndex == 0) {
            currIndex = files.length - 1;
        } else {
            --currIndex;
        }
        play();
    }
    function next() {
        removeClass(playlist.getElementsByTagName("li")[currIndex], "active");
        if (currIndex == files.length - 1) {
            currIndex = 0;
        } else {
            ++currIndex;
        }
        play();
    }
    function addEvent() {
        prevBtn.addEventListener("click", prev);
        nextBtn.addEventListener("click", next);
        playBtn.addEventListener("click", function () {
            if (status == 0) {
                play();
            } else {
                stop();
            }
        });
        volume.onchange = function () {
            if (gainNode) {
                gainNode.gain.value = this.value / 100;
            }
        };
        playlist.addEventListener("click", function (e) {
            var target = e.target;
            if (target.className == "item") {
                removeClass(playlist.getElementsByTagName("li")[currIndex], "active");
                currIndex = target.getAttribute("data-id");
                play();
            }
        });
        source.onended = next;
    }

    fileInput.onchange = function () {
        if (fileInput.files.length > 0) {
            addMusic(fileInput.files);
            fileInput.value = '';
            if (status == 0) {
                currIndex = 0;
                play();
                addEvent();
            }
        }
    };
    function checkExist(files, f) {
        for (var i = 0, len = files.length; i < len; i++) {
            if (f.name == files[i].name) {
                return true;
            }
        }
        return false;
    }
    function addMusic(f) {
        var list = "";
        for (var i = 0, len = f.length; i < len; i++) {
            if (f[i].size > 20 * 1024 * 1024) {
                console.log(f[i].name + " is shouldn't larger than 20mb!");
                continue;
            }
            if (files.length > 0 && checkExist(files, f[i])) {
                console.log(f[i].name + " is existed!");
                continue;
            }
            list += "<li class='item' data-id='" + idx + "'>" + f[i].name.slice(0, -4) + "</li>";
            files.push(f.item(i));
            idx++;
        }
        playlist.innerHTML += list;
    }
    function play() {
        source && source[source.stop ? "stop" : "noteOff"]();
        document.getElementById("song").innerText = files[currIndex].name.slice(0, -4);
        var fr = new FileReader();
        fr.onload = function (e) {
            var result = e.target.result;
            gainNode = ac[ac.createGain ? "createGain" : "createGainNode"]();
            gainNode.connect(ac.destination);
            analyser = ac.createAnalyser();
            analyser.fftSize = size;
            analyser.connect(gainNode);
            ac.decodeAudioData(result, function (buffer) {
                var bs = ac.createBufferSource();
                bs.buffer = buffer;
                bs.connect(analyser);
                bs[bs.start ? "start" : "noteOn"]();
                status = 1;
                addClass(playlist.getElementsByTagName("li")[currIndex], "active");
                source = bs;
                animate();
            }, function (err) {
                console.log(err)
            });
        };
        fr.readAsArrayBuffer(files[currIndex]);
        logo.style.animationPlayState = "running";
        replaceClass(playBtn, "fa-play", "fa-pause");
    }
    function addClass(el, cls) {
        el.className += " " + cls;
    }
    function removeClass(el, cls) {
        el.className = el.className.replace(" " + cls, "");
    }
    function replaceClass(el, cls, cls2) {
        el.className = el.className.replace(cls, cls2);
    }
    function stop() {
        source && source[source.stop ? "stop" : "noteOff"]();
        status = 0;
        source = null;
        logo.style.animationPlayState = "paused";
        removeClass(playlist.getElementsByTagName("li")[currIndex], "active");
        replaceClass(playBtn, "fa-pause", "fa-play");
    }
    function addCaps() {
        caps = [];
        for (var i = 0; i < size; i++) {
            caps[i] = {
                h: 0
            }
        }
    }
    function animate() {
        var arr = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(arr);
        draw(arr);
        requestAnimationFrame(animate);
    }
    function draw(arr) {
        c.clearRect(0, 0, canvas.width, canvas.height);
        for (var i = 0; i < size; i++) {
            var cap = caps[i];
            var h = arr[i] / 256 * H;
            var capH = 5;
            c.fillRect((w + step) * i, H - h, w, h);
            c.fillRect((w + step) * i, H - cap.h - capH, w, capH);
            cap.h--;
            if (cap.h < 0) {
                cap.h = 0;
            }
            if (h > 0 && cap.h < h + 20) {
                cap.h = h + 20 > H - capH ? H - capH : h + 20;
            }
        }
    }