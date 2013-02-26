// Utility functions

var getCoupon = function() {
	var coupon = new card('http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=9769&type=card', 'Ashnod`s Coupon', 'Artifact')
	return coupon;
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

// Integration

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

test('Permanent object', function() {
	var our_card = getCoupon();
	var our_permanent = new permanent(our_card);
	equal(our_permanent.getName(), 'Ashnod`s Coupon', 'Name of card used as name of permanent');
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
});
