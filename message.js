'use strict';

var message = 'Hello world!';
var key = sjcl.codec.utf8String.toBits('foobar');
var hashes = [];

function random_base64(length) {
    var ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    var str = "";
    for (var i=0; i < length; ++i) {
        var rand = Math.floor(Math.random() * ALPHABET.length);
        str += ALPHABET.substring(rand, rand+1);
    }
    return str;
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex ;

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
}

for (var i = 0; i < message.length; i++) {
    var mac = new sjcl.misc.hmac(key);
	var hash = mac.encrypt(message[i]);
    hashes.push({
        'character': message[i],
        'hash': hash.join(''),
        'key': key,
        'index': i
    });

    var randomCharacter = random_base64(1);
    var randomKey = sjcl.codec.utf8String.toBits(random_base64(key.length));
    var noiseMac = new sjcl.misc.hmac(randomKey);
	var noiseHash = noiseMac.encrypt(randomCharacter);
    hashes.push({
        'character': randomCharacter,
        'hash': noiseHash.join(''),
        'key': randomKey,
        'index': i
    });
}

shuffle(hashes);

var rebuilt = [];
for (var i = 0; i < hashes.length; i++) {
    var macz = new sjcl.misc.hmac(key);
	var hashz = macz.encrypt(hashes[i].character).join('');

    if (hashz === hashes[i].hash) {
        rebuilt[hashes[i].index] = hashes[i].character;
    }
}

console.log(rebuilt.join(''));
