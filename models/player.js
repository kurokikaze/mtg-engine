/*
 * Player. There can be more than two
 */
var player = function(name) {
    this.getName = function() { 
        return name; 
    };
    this.handlers = {};
    this.deck = [];
    this.life = 20;
    this.landToPlay = 1;
	this.manapool = {
		'W': 0,
		'U': 0,
		'B': 0,
		'R': 0,
		'G': 0,
		'X': 0
	};
    this.flags = {
        'drawnFromEmptyLibrary' : false,
	    'won' : false
    }

    this.battlefield = false;
    this.library = false;
    this.graveyard = false;
    this.hand = false;

    //return this;
}

player.prototype.timeoutPriority = function() {
    return true;
}

player.prototype.givePriority = function() {
    return true;
}

player.prototype.draw = function() {
    this.trigger('draw-replace'); // this is stupid
    if (this.library.contents.length == 0) {
        this.flags.drawnFromEmptyLibrary = true;
    } else {
        var card = this.library.contents.pop();
        this.hand.place(card);
        this.trigger('draw');
    }
    return true;
}

player.prototype.setBattlefield = function(battlefield) {
    this.battlefield = battlefield;
}

player.prototype.setLibrary = function(library) {
    library.setOwner(this);
    this.library = library;
}

player.prototype.setHand = function(hand) {
    hand.setOwner(this);
    this.hand = hand;
}

player.prototype.setGraveyard = function(graveyard) {
    graveyard.setOwner(this);
    this.graveyard = graveyard;
}

// This is clumsy
player.prototype.addMana = function(color, amount){
    this.manapool[color] += amount;
    this.trigger('addMana', color, amount);
};

player.prototype.hasMana = function(color, amount){
     return (this.manapool[color] >= amount);
};

player.prototype.on = function(event, callback) {
    if (!this.handlers[event]) {
        this.handlers[event] = [];
    }
    if (this.handlers[event].length > 3) {
        console.log('!!! Event "' + event + '" has too many handlers');
    }
    this.handlers[event].push(callback);
}

player.prototype.trigger = function(event, data) {
    if (this.handlers[event] && this.handlers[event].length > 0) {
        for (var handler_id = 0; handler_id < this.handlers[event].length; handler_id++) {
            this.handlers[event][handler_id].call();
        }
    }
}

player.prototype.clearEvent = function(event) {
    if (this.handlers[event] && this.handlers[event].length > 0) {
        this.handlers[event] = [];
    }
}

player.prototype.owns = function(tested_card) {
	if (tested_card instanceof card) {
		return (tested_card.getOwner() == this);
	}
}

player.prototype.setDeck = function(deck) {
	this.deck = deck;
}

player.prototype.getDeck = function(deck) {
	return this.deck;
}

player.prototype.removeHandlers = function(event) {
    if (this.handlers[event]) {
        this.handlers[event] = [];
    }
}

player.prototype.playLand = function(card) {
    if (this.landToPlay > 0 && 
        this.game.isMainPhase() &&
        card.hasType('Land')) {
        this.game.playLand(card);
    }
}

player.prototype.concede = function() {
    console.log('$$$ Conceding');
    // we can concede only when the game is set
    if (this.game) {
        console.log('%%% Game is registered');
        this.game.concede(this);
    }
}
