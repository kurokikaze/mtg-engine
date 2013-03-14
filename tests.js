// Utility functions

var getCoupon = function() {
	var coupon = new card('http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=9769&type=card', 'Ashnod`s Coupon', 'Artifact')
	return coupon;
}

var getBear = function() {
	var bear = new card('http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=9769&type=card', 'Grizzly Bears', 'Creature');
	bear.setManaCost({'G':1, 'C':1});
	return bear;
}

// Tests

test('Player object', function() {
	equal((new player('test')).getName(), 'test', 'Storing and returning name');
	equal((new player('test')).flags.drawnFromEmptyLibrary, false, 'Flags are present on creation, DFEL is false');
	equal((new player('test')).flags.won, false, 'Winning flag is present and set to false');
	equal((new player('test')).life, 20, 'Player starts at 20 life');
	var johnny = new player('Johnny');
	johnny.addMana('R', 2);
	ok(johnny.hasMana('R', 2), 'Can add/check mana in pool');
	johnny.addMana('R', 1);
	ok(johnny.hasMana('R', 3), 'Mana in pool stacks');
	// Setting player zones
	var spike = new player('Spike');
	var hand = new zone('test_hand', true, true);
	spike.setHand(hand);
	equal(spike.hand.getName(), 'test_hand', 'Saving zone as hand works');
	equal(hand.owner.getName(), 'Spike', 'Setting owner of zone when saving works');
	var spike = new player('Spike');
	var library = new zone('test_library', true, true);
	spike.setLibrary(library);
	equal(spike.library.getName(), 'test_library', 'Saving zone as library works');
	equal(library.owner.getName(), 'Spike', 'Setting owner of zone when saving works');
	var spike = new player('Spike');
	var graveyard = new zone('test_graveyard', true, true);
	spike.setGraveyard(graveyard);
	equal(spike.graveyard.getName(), 'test_graveyard', 'Saving zone as graveyard works');
	equal(graveyard.owner.getName(), 'Spike', 'Setting owner of zone when saving works');
	var johnny = new player('Johnny');
	var bear = getBear();
	bear.setOwner(johnny);
	equal(johnny.owns(bear), true, 'Checking ownership on own cards work');
	var spike = new player('Spike');
	var other_bear = getBear();
	other_bear.setOwner(spike);
	equal(johnny.owns(other_bear), false, 'Checking ownership on another player cards work')
});

test('Card object', function() {
	var test_card = getBear();
	equal(test_card.getName(), 'Grizzly Bears', 'Card name is stored and retrieved');
	equal(test_card.getManaCost().W, 0, 'White mana cost is stored and retrieved');
	equal(test_card.getManaCost().U, 0, 'Blue mana cost is stored and retrieved');
	equal(test_card.getManaCost().B, 0, 'Black mana cost is stored and retrieved');
	equal(test_card.getManaCost().R, 0, 'Red mana cost is stored and retrieved');
	equal(test_card.getManaCost().G, 1, 'Green mana cost is stored and retrieved');
	equal(test_card.getManaCost().C, 1, 'Colorless mana cost is stored and retrieved');
	var test_card = getBear();
	var johnny = new player('Johnny');
	test_card.setOwner(johnny);
	equal(test_card.getOwner(), johnny, 'Owner is stored and retrieved correctly');
	var test_card = getBear();
	var johnny = new player('Johnny');
	var johnny_library = new zone('library', true, true);
	johnny.setLibrary(johnny_library);
	test_card.setOwner(johnny);
	test_card.goLibrary();
	equal(johnny_library.contents.length, 1, 'Card goes to its owner library');	
	var johnny = new player('Johnny');
	var johnny_graveyard = new zone('graveyard', true, true);
	johnny.setGraveyard(johnny_graveyard);
	test_card.setOwner(johnny);
	test_card.goGraveyard();
	equal(johnny_graveyard.contents.length, 1, 'Card goes to its owner graveyard');
	
});

test('Stack object', function() {
	var test_card = getBear();
    var test_spell = new spell(test_card);
    var stack = new stack_object;
    equal(stack.getContents().length, 0, 'Stack is empty on creation');
    stack.put(test_spell);
    equal(stack.getContents().length, 1, 'The spell is on stack');
    equal(stack.getContents()[0], test_spell, 'Test spell is on stack');
    var resolving_spell = stack.pop();
    equal(stack.getContents().length, 0, 'Test spell is removed from the stack');
    equal(resolving_spell, test_spell, 'Resolving spell is the test spell');
});


test('Player object events', 1, function(){
	var spike = new player('Spike');
	spike.on('test', function() {
		ok(true, 'Player event is passed through');
	});
	spike.trigger('test');
});

test('Zone object', function() {
	equal((new zone('test', true, true)).getName(), 'test', 'Storing and returning name');
	var johnny = new player('Johnny');
	var hand = new zone('hand', true, true);
	hand.setOwner(johnny);
	equal(hand.owner.getName(), 'Johnny', 'Setting zone owner works');
});


test('Permanent object', function() {
	var our_card = getBear();
	var our_permanent = new permanent(our_card);
	equal(our_permanent.getName(), 'Grizzly Bears', 'Name of card used as name of permanent');
	var our_token = new permanent({
		'name': 'Centaur',
		'power': 2,
		'toughness': 2
	});
	equal(our_token.getName(), 'Centaur' , 'Name of token is stored and passed correctly.');
	var our_card = getCoupon();
	var our_permanent = new permanent(our_card);
	equal(our_permanent.isTapped(), false, 'Permanent is created untapped');
	our_permanent.tap();
	equal(our_permanent.isTapped(), true, 'Permanent can be tapped');
	our_permanent.untap();
	equal(our_permanent.isTapped(), false, 'Permanent can be untapped');
	var our_card = getBear();
	var our_permanent = new permanent(our_card);
	equal(our_permanent.getManaCost().G, 1, 'Card cost is used as permanent cost')
});


test('Spell object', function() {
	var our_card = getBear();
	var johnny = new player('Johnny');
	our_card.setOwner(johnny);
	var our_spell = new spell(our_card);
	equal(our_spell.representedBy, our_card, 'Spell is represented by right card');
	equal(our_spell.getOwner(), johnny, 'Spell owner is passed correctly');
});

// Integration tests

test('Drawing from library', function() {
	// Here's our player
	var johnny = new player('Johnny');
	// This will be his library
	var library = new zone('Johnny`s library', true, true);
	// This will be his hand
	var hand = new zone('Johnny`s hand', false, true);
	// This is his only card
	var our_card = getCoupon();
	// Put it in the library
	library.place(our_card);
	// Give this deck to Johnny
	johnny.setLibrary(library);
	// Set his hand (drawn cards go here)
	johnny.setHand(hand);
	// Draw a card
	johnny.draw();
	// Test that Johnny has drawn our card
	equal(johnny.hand.contents.length, 1, 'Has a card in hand after drawing');
	equal(johnny.library.contents.length, 0, 'Has no cards in library after drawing');
	equal(johnny.hand.contents[0].getName(), 'Ashnod`s Coupon', 'Drawn card is Ashnod`s Coupon');
	equal(johnny.flags.drawnFromEmptyLibrary, false, 'Johnny is not marked as having drawn card from empty library');
});

test('Registering deck', function() {
	var johnny = new player('Johnny');
	var bear = getBear();
	var johnnys_deck = [];
	johnnys_deck.push(bear);
	johnny.setDeck(johnnys_deck);
	var game = new engine();
	game.addPlayer(johnny);
	equal(bear.getOwner().getName(), 'Johnny', 'Cards in registered deck are marked as owned by right player');
});

test('Drawing from empty library', function() {
	// Here's our player
	var johnny = new player('Johnny');
	// This will be his library
	var library = new zone('Johnny`s library', true, true);
	// This will be his hand
	var hand = new zone('Johnny`s hand', false, true);
	// Give empty deck to Johnny
	johnny.setLibrary(library);
	// Set his hand (drawn cards go here)
	johnny.setHand(hand);
	// Draw a card
	johnny.draw();
	// Test that Johnny has drawn our card
	equal(johnny.hand.contents.length, 0, 'Has no cards in hand after drawing');
	equal(johnny.library.contents.length, 0, 'Has no cards in library after drawing');
	equal(johnny.flags.drawnFromEmptyLibrary, true, 'Johnny is marked as having drawn card from empty library');
});

test('APNAP priority order', 1, function() {
	var $fixture = $('#qunit-fixture');
	$fixture.append('<div id="actions"></div>');
	$fixture.append('<div id="zones"></div>');
	$fixture.append('<div id="steps"></div>');

	var teststring = '';

	var priority_player = function(phrase) {
		var that = this;
		this.givePriority = function() {
			console.log('Test player got priority');
			teststring = teststring + phrase;
			that.trigger('pass');
		}
	};

	priority_player.prototype = new player();

	// Here's our player 1
	var johnny = new priority_player('AP');
	johnny.on('')
	// Here's our player 1
	var timmy = new priority_player('NAP');

	var test_game = new engine();
	//
	test_game.on('eop_Untap', function() {
		// finish the game on the end of turn one phase one
		test_game.flags.finished = true;
	});

	test_game.on('finish', function() {
		equal(teststring, 'APNAP', 'Players are given priority in APNAP order');
	});
	test_game.addPlayer(johnny);
	test_game.addPlayer(timmy);

	test_game.start();
});
