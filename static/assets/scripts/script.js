window.onload = function() {
    var lastMousePos = {
        x: -1,
        y: -1
    };
    var lastSent = 0;
    var generatorRunning = true;
    var contributeIntervalTimeout = 5000;
    var appendedEntropy = '';
    var socket = io.connect('https://crowdsprout.herokuapp.com:80');
    var genText = $("#generated-text"),
        generateType = $("#randomType"),
        passOptNum = $("#passOptNum"),
        passOptMixedCase = $("#passOptMixedCase"),
        passOptSymbol = $("#passOptSymbol"),
        passLength = $("#passLength"),
        minNum = $("#minNum"),
        maxNum = $("#maxNum"),
        pausePlayButton = $("#pausePlayButton");
    var contribute = $.cookie('contribute') != undefined ? $.cookie('contribute') : 1;
    var contributeInterval = undefined;
    var maxHistory = 20;

    var clippy = new Clipboard('.copy-history');

 
    clippy.on('success', function(e) {
        e.clearSelection();

       $(e.trigger).tooltip({title: 'Copied',placement:'right'}).tooltip('show');
       setTimeout(function() {$(e.trigger).tooltip('destroy');},1200);
    });
    clippy.on('error', function(e) {

        
    });

    pausePlayButton.click(function() {
        if (generatorRunning) {
            generatorRunning = false
                // socket.disconnect();
            socket.emit('clientStatus', {
                seedStream: false
            });
            $(this).children("span").addClass("glyphicon-play").removeClass("glyphicon-pause");
        } else {
            generatorRunning = true;
            //socket.connect();
            socket.emit('clientStatus', {
                seedStream: true
            });
            $(this).children("span").addClass("glyphicon-pause").removeClass("glyphicon-play");
        }
    });

    // handle opt out radio button
    $('input:radio[name="contributeRadio"][value="' + contribute + '"]').attr('checked', 'checked').parent('.btn').addClass('active');
    $('input:radio[name="contributeRadio"]').change(function() {
        if ($(this).is(':checked') && $(this).val() == '1') {
            $.cookie('contribute', '1');
            startContributeInterval();
        } else {
            $.cookie('contribute', '0');
            clearInterval(contributeInterval);
        }
    });
    socket.on('message', function(data) {
        if (data.message) {
            // check if number before we use
            generated = (generateType.val() == 'password' ? generatePassword(data.message) : generateNumber(data.message, parseInt(minNum.val()), parseInt(maxNum.val())));
            // add generated text/number to text input field        
            genText.val(generated);
            // prepend to history list 
            $("#generator-history-list").prepend('<li><a class="copy-history" href="javascript:void(0);" alt="Copy to clipboard" data-clipboard-text="' + generated + '">' + generated + '</a></li>');
            // trim history list if greater than our config vaue
            if ( $('#generator-history-list li').length > maxHistory ) {
                $('#generator-history-list li:last').remove();
            }


        } else {
            console.log("An error has occured:", data.message);
        }
    });
    $("#randomType").change(function() {
        if ($(this).val() == 'password') {
            $("#passOptionsGroup").show();
            $("#numOptionsGroup").hide();
        } else {
            $("#passOptionsGroup").hide();
            $("#numOptionsGroup").show()
        }
    });
    $("body").mousemove(function(e) {
        lastMousePos.x = e.pageX;
        lastMousePos.y = e.pageY;
        appendedEntropy += lastMousePos.x + lastMousePos.y
        if (appendedEntropy.length > 32) {
            appendedEntropy = appendedEntropy.slice(-32);
        }
    });
    $(document).scroll(function() {
        appendedEntropy += Math.floor($(this).scrollTop());
        if (appendedEntropy.length > 32) {
            appendedEntropy = appendedEntropy.slice(-32);
        }
    });
    var startContributeInterval = function() {
        contributeInterval = setInterval(function() {
            if (appendedEntropy.length > 0 && appendedEntropy.length > 20) {
                socket.emit('send', {
                    message: appendedEntropy
                });
                lastSent = appendedEntropy;
                appendedEntropy = '';
            }
        }, contributeIntervalTimeout);
    };
    var generateNumber = function(seed, min, max) {
        return Math.floor(Math.abs(Math.sin(seed)) * (max - min + 1)) + min;
    };
    var SeededRandom = function(seed) {
        var seeded = parseInt(seed);
        return {
            random: function() {
                seeded = (seeded * 9301 + 49297) % 233280;
                return (seeded / 233280);
            }
        }
    }
    var generatePassword = function(number) {
        var seededRandom = SeededRandom(number);
        var length = parseInt(passLength.val()) > 0 ? parseInt(passLength.val()) : 15;
        var lengthUsed = 0;
        letterL = "abcdefghijklmnopqrstuvwxyz",
            letterU = "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
            numbers = "0123456789",
            symbols = "@#!*&^%$",
            genPass = "";
        var charset = letterL;
        if (passOptNum.is(':checked')) {
            charset += numbers;
        }
        if (passOptMixedCase.is(':checked')) {
            charset += letterU;
        }
        if (passOptSymbol.is(':checked')) {
            charset += symbols;
        }
        // shuffle charset
        var charSplit = charset.split("");
        for (var i = charSplit.length - 1; i > 0; i--) {
            var j = Math.floor(seededRandom.random() * (i + 1));
            var x = charSplit[i];
            charSplit[i] = charSplit[j];
            charSplit[j] = x;
        }
        charset = charSplit.join("");
        for (var i = 0, n = charset.length; i < length; ++i) {
            genPass += charset.charAt(Math.floor(seededRandom.random() * n));
        }
        return genPass;
    };
    if (contribute == 1) {
        startContributeInterval();
    }
}