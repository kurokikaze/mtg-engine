/*
 * Player. There can be more than two
 */
define(['/models/card.js'], function(Card) {
	var Player = Backbone.Model.extend({
		name: false,
		getName: function() { 
			return this.name; 
		},
		deck: [],
		life: 20,
		landToPlay: 1,
		manapool: {
			'W': 0,
			'U': 0,
			'B': 0,
			'R': 0,
			'G': 0,
			'X': 0
		},
		flags: {
			'drawnFromEmptyLibrary' : false,
			'won' : false
		},
		battlefield: false,
		library: false,
		graveyard: false,
		hand: false,
		initialize: function(name) {
			this.name = name;
			//return this;
		},
		setBattlefield: function(battlefield) {
			this.battlefield = battlefield;
		},
		setLibrary: function(library) {
			library.setOwner(this);
			this.library = library;
		},
		setHand: function(hand) {
			hand.setOwner(this);
			this.hand = hand;
		},
		setGraveyard: function(graveyard) {
			graveyard.setOwner(this);
			this.graveyard = graveyard;
		},
		addMana: function(color, amount){
			this.manapool[color] += amount;
			this.trigger('addMana', color, amount);
		},
		hasMana: function(color, amount){
			return (this.manapool[color] >= amount);
		},
		owns: function(tested_card) {
			if (tested_card instanceof Card) {
				return (tested_card.get('owner') == this);
			}
		},
		playLand: function(card) {
			if (this.landToPlay > 0 && 
				this.game.isMainPhase() &&
				card.hasType('Land')) {
				this.game.playLand(card);
			}
		},
		concede: function() {
			console.log('$$$ Conceding');
			// we can concede only when the game is set
			if (this.game) {
				console.log('%%% Game is registered');
				this.game.concede(this);
			}
		}
	});

	return Player;
});