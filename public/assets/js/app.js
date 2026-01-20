// DATA
let connection = new TikTokIOConnection(undefined);
let gameWords = [];
let gamegameSelectedWord = null;
let gameTimer = null;
let gameStatus = false;

// Config
let confComment = false;
let confLike = false;
let confShare = false;
let confJoin = false;

// START
$(document).ready(() => {
    // Resize
    function resizeContainer() {
        let height = window.innerHeight;
        let width = height * (9 / 16);

        // Si el ancho calculado es mayor que el ancho de la ventana, ajustamos por el ancho
        if (width > window.innerWidth) {
            width = window.innerWidth;
            height = width * (16 / 9);
        }

        if (document.fullscreenElement) {
            // En fullscreen dejamos que el CSS maneje el tamaño 100vw/100vh
            // pero mantenemos la lógica de cálculo para el papel interno
            height = window.innerHeight;
            width = height * (9 / 16);

            $("#gameSize").html(Math.round(width) + 'x' + Math.round(height));
            $(".container").css({
                'width': '100vw',
                'height': '100vh'
            });
        } else {
            $("#gameSize").html(Math.round(width) + 'x' + Math.round(height));
            $(".container").css({
                'width': width + 'px',
                'height': height + 'px'
            });
        }

        // El papel se ajusta proporcionalmente al alto calculado (9:16)
        let paperHeight = $("#paperContainer").height();
        $("#paper").css({
            'max-height': (paperHeight - (height * 0.05)) + 'px',
            'margin-top': '-' + (height * 0.01) + 'px'
        });
    }
    resizeContainer();
    $(window).resize(function () {
        resizeContainer();
    });

    // Fullscreen Toggle
    $("#toggleFullscreen").click(function () {
        if (!document.fullscreenElement) {
            $(".container")[0].requestFullscreen().catch(err => {
                alert(`Error al intentar activar pantalla completa: ${err.message}`);
            });
            $(this).html("⏬");
        } else {
            document.exitFullscreen();
            $(this).html("🔲");
        }
    });

    // Connect
    $("#targetConnect").click(function (e) {
        // Check
        if (gameStatus) {
            let targetLive = $("#targetUsername").val();
            connect(targetLive);
        } else {
            alert("¡Inicia el juego primero!");
        }

    });

    // Test
    $("#btnPrepare").click(function (e) {
        // Check sound
        playSound(1);
        playSound(2);
        playSound(3);
        playSound(4);
        speakTTS(MSG_TEST);

        // Populate dummy (use localized welcome)
        const pageLang = (document.documentElement && document.documentElement.lang) ? document.documentElement.lang : 'en';
        const welcomeText = (pageLang === 'es') ? '¡Bienvenido! 🥳🥳🥳' : 'Welcome 🥳🥳🥳';
        for (let i = 0; i < 30; i++) {
            addContent("<div style='text-align:center;'>" + welcomeText + "</div>");
        }

        // Load game
        loadGame();

        // Setting
        loadSetting();

        // Set
        gameStatus = true;
    });

    // Auto-load settings from Admin Panel
    loadSetting();

    // Save config
    $("#btnSave").click(function (e) {
        loadSetting();
    });
})

/*
* GAME PLAY
*/

function speakTTS(msg) {
    speak(msg, {
        amplitude: 100,
        pitch: 100,
        speed: 150,
        wordgap: 5
    });
}

function censor(word) {
    let censored = [];
    let length = word.length;
    let target = Math.ceil(length / 2);

    let range_start = 2;
    let range_end = target;

    for (let i = 0; i < length; i++) {
        let c = word.charAt(i);
        if (i >= range_start && i <= range_end) {
            censored.push("*");
        } else {
            censored.push(c);
        }
    }

    return censored.join("");
}

function copyArray(a) {
    let b = [];
    for (i = 0; i < a.length; i++) {
        b[i] = a[i];
    }
    return b;
}

function shuffle(a) {
    let j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return copyArray(a);
}

function countDown() {
    // Counter
    let timeleft = 60 * 5; // 5 Mins

    // Clear
    if (gameTimer != null) {
        clearInterval(gameTimer);
    }

    // Start
    gameTimer = setInterval(function () {
        // Reset
        if (timeleft <= 0) {
            clearInterval(gameTimer);
            loadGame();
        }

        // Set
        $("#gameTimeout").html(timeleft.toLocaleString() + "s");
        timeleft -= 1;

    }, 1000);
}

function loadGame() {
    // Check
    if (gameWords.length < 1) {
        gameWords = shuffle(WORDS);
    }

    // Load
    gameSelectedWord = gameWords.pop();

    // Set remain words
    $("#gameWords").html(gameWords.length);

    // Check
    if (typeof gameSelectedWord === 'string') {
        // Normalize
        splittedWord = gameSelectedWord.split("|");
        gameSelectedWord = splittedWord[1];

        // Localize category label (accept both English and Spanish tokens)
        const pageLang = (document.documentElement && document.documentElement.lang) ? document.documentElement.lang : 'en';
        const rawCategory = (splittedWord[0] || '').toString().toLowerCase();

        // Mapping of known category keys to localized labels
        const CATEGORY_LABELS = {
            animal: { en: 'Animal', es: 'Animal' },
            fruta: { en: 'Fruit', es: 'Fruta' },
            fruit: { en: 'Fruit', es: 'Fruta' },
            deporte: { en: 'Sport', es: 'Deporte' },
            sport: { en: 'Sport', es: 'Deporte' },
            color: { en: 'Color', es: 'Color' },
            pais: { en: 'Country', es: 'País' },
            country: { en: 'Country', es: 'País' },
            pelicula: { en: 'Movie', es: 'Película' },
            movie: { en: 'Movie', es: 'Película' },
            trabajo: { en: 'Job', es: 'Trabajo' },
            job: { en: 'Job', es: 'Trabajo' },
            objeto: { en: 'Object', es: 'Objeto' },
            object: { en: 'Object', es: 'Objeto' },
            emocion: { en: 'Emotion', es: 'Emoción' },
            emotion: { en: 'Emotion', es: 'Emoción' }
        };

        let displayCategory;
        if (CATEGORY_LABELS.hasOwnProperty(rawCategory)) {
            displayCategory = (pageLang === 'es') ? CATEGORY_LABELS[rawCategory].es : CATEGORY_LABELS[rawCategory].en;
        } else {
            // Fallback: title-case the raw category
            displayCategory = (splittedWord[0] || '').toString();
            displayCategory = displayCategory.charAt(0).toUpperCase() + displayCategory.slice(1);
        }

        // Set
        $("#textGuess").html("<div style='font-size:70%;padding-bottom:5px;'>" + displayCategory + "</div>" + censor(gameSelectedWord));

        // Timeout
        countDown();

    } else {
        loadGame();
    }
}

function checkWinner(data, msg) {
    // Check type
    if (typeof gameSelectedWord === 'string' && typeof msg === 'string') {
        // Check answer
        if (gameSelectedWord.trim().toLowerCase() == msg.trim().toLowerCase()) {
            // Print Photo
            addPhoto(data, "winner");

            // Sound
            playSound(4);

            // Play TTS
            const pageLang = (document.documentElement && document.documentElement.lang) ? document.documentElement.lang : 'en';
            let userName = (data.user && (data.user.uniqueId || data.user.nickname)) ? (data.user.uniqueId || data.user.nickname) : (pageLang === 'es' ? 'Desconocido' : 'Unknown');
            let tssMsg = MSG_WINNER.replace("|username|", userName);
            speakTTS(tssMsg);

            // Reload game
            loadGame();
        }
    }
}

function loadSetting() {
    const CONFIG_KEY = 'tiktok_printer_config';
    const configRaw = localStorage.getItem(CONFIG_KEY);

    if (configRaw) {
        const config = JSON.parse(configRaw);

        // Asignar variables globales
        confComment = config.confComment !== false;
        confLike = config.confLike !== false;
        confShare = config.confShare !== false;
        confJoin = config.confJoin !== false;

        // Sobreescribir mensajes si existen
        if (config.msgGift) {
            window.MSG_GIFT = config.msgGift;
        }
        if (config.msgWinner) {
            window.MSG_WINNER = config.msgWinner;
        }

        // Si hay un tiktokId guardado, lo ponemos en el input si existe en el DOM
        if (config.tiktokId && $("#targetUsername").length) {
            $("#targetUsername").val(config.tiktokId);
        }

        // Session ID Global
        if (config.sessionId) {
            window.SESSION_ID = config.sessionId;
        }

        console.log("Configuración cargada desde Admin Panel.");
    } else {
        // Fallback or legacy load from DOM
        confComment = $("#confComment").prop('checked');
        confLike = $("#confLike").prop('checked');
        confShare = $("#confShare").prop('checked');
        confJoin = $("#confJoin").prop('checked');
    }
}

/*
* LIVE TIKTOK
*/

function connect(targetLive) {
    if (targetLive !== '') {
        const pageLang = (document.documentElement && document.documentElement.lang) ? document.documentElement.lang : 'en';
        $('#stateText').text(pageLang === 'es' ? 'Conectando...' : 'Connecting...');
        $("#usernameTarget").html("@" + targetLive);

        // Prepare connection options
        let options = {
            enableExtendedGiftInfo: true
        };

        // Add Session ID if set in Admin
        if (window.SESSION_ID) {
            options.sessionId = window.SESSION_ID;
            console.log("Connecting with Session ID...");
        }

        connection.connect(targetLive, options).then(state => {
            $('#stateText').text(pageLang === 'es' ? `Conectado ${state.roomId}` : `Connected ${state.roomId}`);
        }).catch(errorMessage => {
            $('#stateText').text(errorMessage);
        })
    } else {
        alert('¡Ingresa el usuario primero!');
    }
}

function sanitize(text) {
    return text.replace(/</g, '&lt;')
}

function isPendingStreak(data) {
    return data.giftType === 1 && !data.repeatEnd;
}

function playSound(mode) {
    document.getElementById("sfx" + mode).play();
}

function addContent(payload) {
    // Container
    let content = $('#paper');
    content.append("<div class='item'>" + payload + "</div>");

    // Scroll top bottom
    content.stop().animate({ scrollTop: content.get(0).scrollHeight }, 500);
}

function addMessage(data, msg) {
    // DATA
    const pageLang = (document.documentElement && document.documentElement.lang) ? document.documentElement.lang : 'en';
    let userName = (data.user && (data.user.uniqueId || data.user.nickname)) ? (data.user.uniqueId || data.user.nickname) : (pageLang === 'es' ? 'Desconocido' : 'Unknown');
    let message = sanitize(msg);

    // Check for voice
    let command = message.split(" ")[0];
    if (command == "/say" || command == "/ngomong") {
        // TTS
        let cleanText = message.replace("/say", "").replace("/ngomong", "");
        speakTTS(cleanText);

    } else {
        // Check setting
        if (confComment) {
            // Add
            addContent("<span style='font-weight: bold;'>" + userName + "</span>: " + message);

            // Sound
            playSound(1);
        }

    }
}

function addGift(data) {
    const pageLang = (document.documentElement && document.documentElement.lang) ? document.documentElement.lang : 'en';
    let userName = (data.user && (data.user.uniqueId || data.user.nickname)) ? (data.user.uniqueId || data.user.nickname) : (pageLang === 'es' ? 'Desconocido' : 'Unknown');
    let giftName = data.gift && data.gift.name ? data.gift.name : (pageLang === 'es' ? 'regalo' : 'gift');
    let repeatCount = data.repeatCount || 1;
    // Texto de regalo fijo solicitado
    let thankYouText = pageLang === 'es' ? '¡Gracias por tu regalo!' : 'Thanks for your gift!';

    // Icono animado
    let giftIcon = `<div style="font-size: 1.5rem; margin-bottom: 0.2rem;">🎁</div>`;

    // Construcción del mensaje estético
    let html = `${giftIcon}
                <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">${thankYouText}</div>
                <div style="font-size: 1.1rem; margin: 0.3rem 0; color: #ea580c;">${userName}</div>
                <div style="font-size: 0.9rem; background: rgba(255,255,255,0.5); padding: 0.2rem 0.5rem; border-radius: 1rem;">
                    ${repeatCount} × ${sanitize(giftName)}
                </div>`;

    addContent(`<div class='gift-message'>${html}</div>`);
    playSound(2);
}

function addPhoto(data, reason) {
    // Get username and profile photo
    const pageLang = (document.documentElement && document.documentElement.lang) ? document.documentElement.lang : 'en';
    let userName = (data.user && (data.user.uniqueId || data.user.nickname)) ? (data.user.uniqueId || data.user.nickname) : (pageLang === 'es' ? 'Desconocido' : 'Unknown');
    let photoUrl = (data.user && data.user.profilePictureUrl) ? data.user.profilePictureUrl : '/assets/img/image.png';
    // Texto de ganador impactante
    let label = reason === 'winner' ? (pageLang === 'es' ? '¡ERES EL GANADOR!' : 'YOU ARE THE WINNER!') : '';

    // HTML Estético
    let html = `<div style="font-size: 1.2rem; font-weight: 900; color: #2563eb; margin-bottom: 0.5rem; text-shadow: 0 2px 0 rgba(255,255,255,0.5);">${label}</div>
                <img src='${photoUrl}' alt='${userName}' style='width: 80px; height: 80px; border-radius: 50%; border: 4px solid white; box-shadow: 0 5px 15px rgba(0,0,0,0.2); margin: 0.5rem 0;' />
                <div style="font-size: 1.3rem; font-weight: 800; color: #1e3a8a; letter-spacing: -0.5px;">${userName}</div>`;

    // Add to chat area
    addContent(`<div class='photo-message'>${html}</div>`);
}

// New chat comment received
connection.on('chat', (data) => {
    addMessage(data, data.comment);
    checkWinner(data, data.comment);
})

// New gift received
connection.on('gift', (data) => {
    console.log('Gift event received:', data);
    addGift(data);
})

// Like
connection.on('like', (data) => {
    if (typeof data.totalLikeCount === 'number') {
        if (confLike) {
            let label = typeof data.label === 'string' ? data.label : '';
            let msg = label.replace('{0:user}', '');
            if (/\blikes?\b/i.test(msg)) {
                msg = msg.replace(/\blikes?\b/gi, `${data.likeCount} me gusta`);
            }
            // Only add message if not empty after replacements
            if (msg.trim() !== '') {
                addMessage(data, msg);
            }
        }
    }
})

// Share, Follow
connection.on('social', (data) => {
    // Check setting
    if (confShare) {
        // Print share
        let label = typeof data.label === 'string' ? data.label : '';
        addMessage(data, label.replace('{0:user}', ''));
    }
})

// Member join
let joinMsgDelay = 0;
connection.on('member', (data) => {
    let addDelay = 250;
    if (joinMsgDelay > 500) addDelay = 100;
    if (joinMsgDelay > 1000) addDelay = 0;

    joinMsgDelay += addDelay;

    setTimeout(() => {
        joinMsgDelay -= addDelay;
        // Check setting
        if (confJoin) {
            // Print join (localized)
            const pageLang = (document.documentElement && document.documentElement.lang) ? document.documentElement.lang : 'en';
            addMessage(data, pageLang === 'es' ? 'se unió' : 'joined');
        }
    }, joinMsgDelay);
})

// End
connection.on('streamEnd', () => {
    const pageLang = (document.documentElement && document.documentElement.lang) ? document.documentElement.lang : 'en';
    $('#stateText').text(pageLang === 'es' ? 'Transmisión finalizada.' : 'Stream ended.');
})
