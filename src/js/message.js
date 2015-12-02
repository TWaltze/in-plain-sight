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
        var noiseHash = sjcl.codec.hex.fromBits(noiseMac.mac(randomCharacter));

        return {
            'character': randomCharacter,
            'hash': noiseHash
        };
    };

    this.chunk = function(str, amount) {
        if (!str || str.length === 0) {
            return [];
        }

        var size = Math.floor(str.length / amount);
        if (size === 0) {
            size = 1;
        }

        var chunks = str.match(new RegExp('.{1,' + size + '}', 'g'));
        if (chunks.length > amount) {
            var start = chunks.slice(0, amount - 1);
            var end = chunks.slice(amount - 1).join('');
            start.push(end);

            chunks = start;
        }
        console.log(chunks);
        return chunks;
    };
};

Message.prototype.deconstruct = function(amount) {
    var _self = this;

    // Break message into chunks
    this.chunk(this.message, amount).forEach(function(character, index) {
        // Generate valid hmac for this character
        var mac = new sjcl.misc.hmac(_self.key);
        var hash = sjcl.codec.hex.fromBits(mac.mac(character));
        _self.hashes.push({
            'character': character,
            'hash': hash,
            'index': index
        });

        // Generate some noise for each character
        for (var i = 0; i < _self.noiseFactor; i++) {
            var random = _self.randomHMAC();
            random.index = index;
            _self.hashes.push(random);
        }
    });

    this.hashes = _.shuffle(this.hashes);

    return this.hashes;
};

Message.prototype.reconstruct = function() {
    var _self = this;
    var rebuilt = [];
    this.hashes.forEach(function(h) {
        var mac = new sjcl.misc.hmac(_self.key);
        var hash = sjcl.codec.hex.fromBits(mac.mac(h.character));

        if (hash === h.hash) {
            rebuilt[h.index] = h.character;
        }
    });

    return rebuilt.join('');
};
