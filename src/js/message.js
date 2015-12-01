'use strict';

var Message = function(key, message, hashes) {
    this.message = message;
    this.key = sjcl.codec.utf8String.toBits(key);
    this.hashes = hashes || [];
    this.noiseFactor = 1000;

    this.randomStr = function(length) {
        var ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
        var str = '';
        for (var i = 0; i < length; ++i) {
            var rand = Math.floor(Math.random() * ALPHABET.length);
            str += ALPHABET.substring(rand, rand + 1);
        }
        return str;
    };

    this.randomHMAC = function() {
        var randomCharacter = this.randomStr(1);
        var randomKey = sjcl.codec.utf8String.toBits(this.randomStr(10));
        var noiseMac = new sjcl.misc.hmac(randomKey);
        var noiseHash = noiseMac.encrypt(randomCharacter);

        return {
            'character': randomCharacter,
            'hash': noiseHash.join('')
        };
    };

    this.shuffle = function(array) {
        var currentIndex = array.length;
        var temporaryValue;
        var randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    };
};

Message.prototype.deconstruct = function() {
    var _self = this;

    // Break message into characters
    this.message.split('').forEach(function(character, index) {
        // Generate valid hmac for this character
        var mac = new sjcl.misc.hmac(_self.key);
        var hash = mac.encrypt(character);
        _self.hashes.push({
            'character': character,
            'hash': hash.join(''),
            'index': index
        });

        // Generate some noise for each character
        for (var i = 0; i < _self.noiseFactor; i++) {
            var random = _self.randomHMAC();
            random.index = index;
            _self.hashes.push(random);
        }
    });

    return this.shuffle(this.hashes);
};

Message.prototype.reconstruct = function() {
    var _self = this;
    var rebuilt = [];
    this.hashes.forEach(function(h) {
        var mac = new sjcl.misc.hmac(_self.key);
        var hash = mac.encrypt(h.character).join('');

        if (hash === h.hash) {
            rebuilt[h.index] = h.character;
        }
    });

    return rebuilt.join('');
};
