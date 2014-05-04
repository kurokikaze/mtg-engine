require([
	'/models/View.js',
	'/models/step.js',
	'/models/player.js',
	'/models/card.js',
	'/models/zone.js',
	'/models/stack.js',
	'/models/spell.js',
	'/models/permanent.js',
	'/models/mtg-engine.js',
], function(View, Step, Player, Card, Zone, Stack, Spell, Permanent, Engine){
// Utility functions

    var getCoupon = function() {
        var coupon = new Card('http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=9769&type=card', 'Ashnod`s Coupon', 'Artifact')
        return coupon;
    }

    var getBear = function() {
        var bear = new Card('http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=9769&type=card', 'Grizzly Bears', 'Creature');
        bear.setManaCost({'G':1, 'C':1});
        return bear;
    }
	window.getBear = getBear;

    var getIsland = function() {
        var island = new Card('http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=177737&type=card', 'Island', 'Land');
        island.setSubtypes('Island');
        return island;
    }

    var putCardIntoHand = function(game, ourPlayer, card) {
        card.setOwner(ourPlayer);
        game.on('gameStart', function() {
            var targetPlayer = false;
            var gamePlayers = this.getPlayers();
            // Searching for target player in game players
            for (var player_id in gamePlayers) {
                if (gamePlayers[player_id] == ourPlayer) {
                    targetPlayer = gamePlayers[player_id];
                }
            }
            // If player is found...
            if (targetPlayer) {
                // ...place card in his hand
                targetPlayer.hand.place(card);
            }
        });
    }

        var testPlayer = function(name) {
            var that = this;
            this.name = name;
            this.handlers = {};

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

            this.givePriority = function() {
                console.log('Testplayer ' + name + ' got priority');
                var stepName = this.getCurrentStep().name;
                that.game = this; // Contexts...
                that.trigger('step#' + stepName, this);
                //console.log('Test player ' + name + ' got priority');
                that.trigger('pass');
            }
        };

        testPlayer.prototype = new Player();

    // Tests

    test('Player object', function() {
        equal((new Player('test')).getName(), 'test', 'Storing and returning name');
        equal((new Player('test')).get('flags').drawnFromEmptyLibrary, false, 'Flags are present on creation, DFEL is false');
        equal((new Player('test')).get('flags').won, false, 'Winning flag is present and set to false');
        equal((new Player('test')).get('life'), 20, 'Player starts at 20 life');
        var johnny = new Player('Johnny');
        johnny.addMana('R', 2);
        ok(johnny.hasMana('R', 2), 'Can add/check mana in pool');
        johnny.addMana('R', 1);
        ok(johnny.hasMana('R', 3), 'Mana in pool stacks');
        // Setting player zones
        var spike = new Player('Spike');
        var hand = new Zone('test_hand', true, true);
        spike.setHand(hand);
        equal(spike.hand.get('name'), 'test_hand', 'Saving zone as hand works');
        equal(hand.get('owner').getName(), 'Spike', 'Setting owner of zone when saving works');
        var spike = new Player('Spike');
        var library = new Zone('test_library', true, true);
        spike.setLibrary(library);
        equal(spike.library.get('name'), 'test_library', 'Saving zone as library works');
        equal(library.get('owner').getName(), 'Spike', 'Setting owner of zone when saving works');
        var spike = new Player('Spike');
        var graveyard = new Zone('test_graveyard', true, true);
        spike.setGraveyard(graveyard);
        equal(spike.graveyard.get('name'), 'test_graveyard', 'Saving zone as graveyard works');
        equal(graveyard.get('owner').getName(), 'Spike', 'Setting owner of zone when saving works');
        var johnny = new Player('Johnny');
        var bear = getBear();
        bear.set('owner', johnny);
        equal(johnny.owns(bear), true, 'Checking ownership on own cards work');
        var spike = new Player('Spike');
        var other_bear = getBear();
        other_bear.set('owner', spike);
        equal(johnny.owns(other_bear), false, 'Checking ownership on another player cards work')
    });

    test('Card object', function() {
        var test_card = getBear();
        equal(test_card.get('name'), 'Grizzly Bears', 'Card name is stored and retrieved');
        equal(test_card.getManaCost().W, 0, 'White mana cost is stored and retrieved');
        equal(test_card.getManaCost().U, 0, 'Blue mana cost is stored and retrieved');
        equal(test_card.getManaCost().B, 0, 'Black mana cost is stored and retrieved');
        equal(test_card.getManaCost().R, 0, 'Red mana cost is stored and retrieved');
        equal(test_card.getManaCost().G, 1, 'Green mana cost is stored and retrieved');
        equal(test_card.getManaCost().C, 1, 'Colorless mana cost is stored and retrieved');
        var test_card = getBear();
        var johnny = new Player('Johnny');
        test_card.set('owner', johnny);
        equal(test_card.get('owner'), johnny, 'Owner is stored and retrieved correctly');
        var test_card = getBear();
        var johnny = new Player('Johnny');
        var johnny_library = new Zone('library', true, true);
        johnny.setLibrary(johnny_library);
        test_card.set('owner', johnny);
        test_card.goLibrary();
        equal(johnny_library.get('contents').length, 1, 'Card goes to its owner library');	
        var johnny = new Player('Johnny');
        var johnny_graveyard = new Zone('graveyard', true, true);
        johnny.setGraveyard(johnny_graveyard);
        test_card.set('owner', johnny);
        test_card.goGraveyard();
        equal(johnny_graveyard.get('contents').length, 1, 'Card goes to its owner graveyard');
        var test_card = getBear();
        test_card.setTypes('Artifact Creature');
        equal(test_card.hasType('Artifact'), true, 'Card type is saved and retrieved (1)');
        equal(test_card.hasType('Creature'), true, 'Card type is saved and retrieved (2)');
        equal(test_card.hasType('Land'), false, 'Card type is saved and retrieved (3)');
        var test_card = getBear();
        test_card.setSubtypes('Lizard Wizard');
        equal(test_card.hasSubtype('Lizard'), true, 'Card subtype is saved and retrieved (1)');
        equal(test_card.hasSubtype('Wizard'), true, 'Card subtype is saved and retrieved (2)');
        equal(test_card.hasSubtype('Human'), false, 'Card subtype is saved and retrieved (3)');
    });

    test('Stack object', function() {
        var test_card = getBear();
        var test_spell = new Spell(test_card);
        var stack = new Stack();
        equal(stack.getContents().length, 0, 'Stack is empty on creation');
        stack.put(test_spell);
        equal(stack.getContents().length, 1, 'The spell is on stack');
        equal(stack.getContents()[0], test_spell, 'Test spell is on stack');
        var resolving_spell = stack.pop();
        equal(stack.getContents().length, 0, 'Test spell is removed from the stack');
        equal(resolving_spell, test_spell, 'Resolving spell is the test spell');
    });


    asyncTest('Player object events', 2, function(){
        var spike = new Player('Spike');
        spike.on('test', function() {
            ok(true, 'Player event is passed through');
        });
        spike.trigger('test');
        var game = new Engine();
        var spike = new testPlayer('Spike');
        game.addPlayer(spike);
        game.addPlayer(new testPlayer('Mike'));
        game.flags.canDrawFromEmptyLibrary = true;
        game.on('eos_Untap',function() {
            console.log('##### Trying to concede...');
            game.concede(spike);
        });
        game.on('eos_Cleanup',function() {
            this.flags.finished = true;
        });
        game.on('finish', function() {
            equal(spike.flags['lost'], true, 'Game ended after player concedes, player marked as lost');
            start();
        });
        game.start();
    });

    test('Zone object', function() {
        equal((new Zone('test', true, true)).get('name'), 'test', 'Storing and returning name');
        var johnny = new Player('Johnny');
        var hand = new Zone('hand', true, true);
        hand.set('owner', johnny);
        equal(hand.get('owner').getName(), 'Johnny', 'Setting zone owner works');
    });


    test('Permanent object', function() {
        var our_card = getBear();
        var our_permanent = new Permanent(our_card);
        equal(our_permanent.getName(), 'Grizzly Bears', 'Name of card used as name of permanent');
        var our_token = new Permanent({
            'name': 'Centaur',
            'power': 2,
            'toughness': 2
        });
        equal(our_token.get('name'), 'Centaur' , 'Name of token is stored and passed correctly.');
        var our_card = getCoupon();
        var our_permanent = new Permanent(our_card);
        equal(our_permanent.isTapped(), false, 'Permanent is created untapped');
        our_permanent.tap();
        equal(our_permanent.isTapped(), true, 'Permanent can be tapped');
        our_permanent.untap();
        equal(our_permanent.isTapped(), false, 'Permanent can be untapped');
        var our_card = getBear();
        var our_permanent = new Permanent(our_card);
        equal(our_permanent.getManaCost().G, 1, 'Card cost is used as permanent cost')
    });


    test('Spell object', function() {
        var our_card = getBear();
        var johnny = new Player('Johnny');
        our_card.set('owner', johnny);
        var our_spell = new Spell(our_card);
        equal(our_spell.get('representedBy'), our_card, 'Spell is represented by right card');
        equal(our_spell.getOwner(), johnny, 'Spell owner is passed correctly');
    });

    // Integration tests

    test('Drawing from library', function() {
        // Here's our player
        var johnny = new Player('Johnny');
        // This will be his library
        var library = new Zone('Johnny`s library', true, true);
        // This will be his hand
        var hand = new Zone('Johnny`s hand', false, true);
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
        equal(johnny.hand.get('contents').length, 1, 'Has a card in hand after drawing');
        equal(johnny.library.get('contents').length, 0, 'Has no cards in library after drawing');
        equal(johnny.hand.get('contents')[0].get('name'), 'Ashnod`s Coupon', 'Drawn card is Ashnod`s Coupon');
        equal(johnny.get('flags').drawnFromEmptyLibrary, false, 'Johnny is not marked as having drawn card from empty library');
    });

    test('Registering deck', function() {
        var johnny = new Player('Johnny');
        var bear = getBear();
        var johnnys_deck = [];
        johnnys_deck.push(bear);
        johnny.set('deck', johnnys_deck);
        var game = new Engine();
        game.addPlayer(johnny);
        equal(bear.getOwner().getName(), 'Johnny', 'Cards in registered deck are marked as owned by right player');
    });

    test('Drawing from empty library', function() {
        // Here's our player
        var johnny = new Player('Johnny');
        // This will be his library
        var library = new Zone('Johnny`s library', true, true);
        // This will be his hand
        var hand = new Zone('Johnny`s hand', false, true);
        // Give empty deck to Johnny
        johnny.setLibrary(library);
        // Set his hand (drawn cards go here)
        johnny.setHand(hand);
        // Draw a card
        johnny.draw();
        // Test that Johnny has drawn our card
        equal(johnny.hand.get('contents').length, 0, 'Has no cards in hand after drawing');
        equal(johnny.library.get('contents').length, 0, 'Has no cards in library after drawing');
        equal(johnny.get('flags').drawnFromEmptyLibrary, true, 'Johnny is marked as having drawn card from empty library');
    });

    test('Engine events', 1, function() {
        var game = new Engine();
        game.on('test', function(data) {
            equal(data, 'Test', 'Data is passed to event handler');
        });
        game.trigger('test', 'Test');
    });

    asyncTest('APNAP priority order', 1, function() {
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

        priority_player.prototype = new Player();

        // Here's our player 1
        var johnny = new priority_player('AP');
        // Give empty deck and hand to Johnny
        johnny.setLibrary(new Zone('Johnny`s library', true, true));
        johnny.setHand(new Zone('Johnny`s hand', false, true));
        // Here's our player 2
        var timmy = new priority_player('NAP');
        timmy.setLibrary(new Zone('Timmy`s library', true, true));
        timmy.setHand(new Zone('Timmy`s hand', false, true));

        var test_game = new Engine();
        test_game.verbose = 'APNAP';
        test_game.flags.canDrawFromEmptyLibrary = true;
        //
        test_game.on('eos_Untap', function() {
            console.log('eos_Untap');
            // finish the game on the end of turn one phase one
            test_game.flags.finished = true;
        });

        test_game.on('finish', function() {
            equal(teststring, 'APNAP', 'Players are given priority in APNAP order');
            start();
        });
        test_game.addPlayer(johnny);
        test_game.addPlayer(timmy);

        test_game.start();
    });

    test('View', function() {
        var game = new Engine();
        var view = game.getView();
        equal(game, view.getGame(), 'View returns correct game instance');
    });

    test('View events', 2, function() {
        var game = new Engine();
        game.flags.verbose = 'VE';
        var view = game.getView();
        view.on('gameStart', function(data) {
            equal(game, this, 'View event uses correct game instance');
            equal(data.players.length, 2, 'View event for game start returns list of players');
        });

        // Finish game at the end of the first phase
        game.on('eos_Untap', function() {
            game.flags.finished = true;
        });

        game.start();
    });

    asyncTest('New putCardIntoHand', 1, function() {
        console.log('Putcards test');
        var game = new Engine();
        game.verbose = 'PC';
        var johnny = new Player('Johnny');
        game.addPlayer(johnny);
        var bears = getBear();
        putCardIntoHand(game, johnny, bears);
        game.on('stepStart#triggers', function() {
            console.log('Stepstart trigger');
            var firstPlayer = this.getPlayers()[0];
            equal(firstPlayer.hand.contents.length, 1, 'Player has card in hand at end of Untap step');
            this.flags.finished = true;
            start();
        });
        game.start();
    });

    asyncTest('Turn Structure', function() {
        console.log('Starting Turn Structure test')
        expect(1);
        var game = new Engine();
        game.verbose = 'TS';
        game.stepDelay = 0;
        var johnny = new testPlayer('Jackie');
        var stepNames = '';
        game.flags.canDrawFromEmptyLibrary = true;
        var bears = getBear();
        putCardIntoHand(game, johnny, bears);
        game.addPlayer(johnny);
        game.on('stepStart#triggers', function() {
            var stepName = this.getCurrentStep().name;
            stepNames = stepNames + ', ' + stepName;
        });
        game.on('eos_Cleanup', function() {
            console.log('Turn Structure callback');
            equal(stepNames, ', Untap, Upkeep, Draw, Precombat Main, Beginning of Combat, Declare Attackers, Declare Blockers, Combat Damage, End of Combat, Post-Combat Main, End, Cleanup', 'Step names are correct');
            this.flags.finished = true;
            start();
        });
        console.log('Starting engine for TurnStructure...');
        game.start();
    });

    asyncTest('Playing land', function() {
        expect(1);
        console.log('Starting PlayingLand test');
        var game = new Engine();
        game.verbose = 'PL';
        game.stepDelay = 0;
        var johnny = new testPlayer('Johnny');
        var johnnys_deck = [];
        johnnys_deck.push(getIsland());
        johnnys_deck.push(getIsland());
        johnnys_deck.push(getIsland());
        johnny.set('deck', johnnys_deck);
        johnny.on('step#Draw', function() {
            console.log('Entering Draw step, ' + johnny.library.contents.length + ' cards in library');
        });

        var land_played = false;

        var times = 1;

        // Play land at the start of precombat main phase
        johnny.on('step#Precombat Main', function() {
            console.log('PlayingLand intermediate event (' + times + ')');
            game.playLand(johnny, johnny.hand.contents[0]);
            land_played = true;
            equal(game.mtg.zone('battlefield').eq(0).contents.length, 1, 'Card is on the battlefield after land is played');
            times++;
            game.flags.finished = true;
        });

        game.on('finish', function() {
            console.log('Finishing PlayingLand test');
            if (!land_played) {
                ok(false, 'Player lost before playing land.')
            }
            start();
        });
        game.addPlayer(johnny);
        game.start();
    });
});