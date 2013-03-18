'use strict';
var engine = function() {
	var steps = [];

	var engine_this = this;
	
	this.handlers = [];

	var currentStep = 0;
	var currentPlayer = 0;

    var view = new View(this);

	var players = [];

	this.cards = [];

	this.flags = {};

	var stack = new stack_object();

    if (!step && !window.step) {
        console.log('Step module is not loaded');
    }

    this.getView = function() {
        return view;
    }

    // Steps
	steps.push(new step('Untap'));
	steps.push(new step('Upkeep'));
	steps.push(new step('Draw').addAction(function() { mtg.currentPlayer().draw();}));
	steps.push(new step('Precombat Main'));
	steps.push(new step('Beginning of Combat'));
	steps.push(new step('Declare Attackers'));
	steps.push(new step('Declare Blockers'));
	steps.push(new step('Combat Damage'));
	steps.push(new step('End of Combat'));
	steps.push(new step('Post-Combat Main'));
	steps.push(new step('End'));
	steps.push(new step('Cleanup'));

	// Check state-based actions
	var check_SBA = function() {
        console.log('Checking state-based actions');
		for (var player_id in players) {
			if (players.hasOwnProperty(player_id)) {
                var checked_player = players[player_id];
				if (checked_player.life <= 0) {
					checked_player.flags['lost'] = true;
					engine_this.trigger('player_lost', players[player_id]);
				}
                if (checked_player.flags['won'] == true) {
					this.flags.finished = true;
				}
                if (checked_player.flags['drawnFromEmptyLibrary'] == true) {
                    console.log('Player has drawn from empty library and will be terminated');
                    this.flags.finished = true;
                }
			}
		}

		for (var player_id in players) {
			if (players.hasOwnProperty(player_id)) {
				
			}
		}
	}

    this.on('stepStart', function(nextStepCallback) {
		var end_step = function() {
			console.log('Step ' + steps[currentStep].name + ' ended');
			engine_this.trigger('eos_' + steps[currentStep].name);
			if (!engine_this.flags.finished) {
				// Move to the next step
				console.log('Setting timeout for new turn');
				setTimeout(function() {
					console.log('New step starting');
                    // we cannot trigger here w/o reworking how step system handles 
                    // async player input
                    if (nextStepCallback) {
                        nextStepCallback();
                    } else {
                        console.log('Current player is ' + currentPlayer + ', current step is ' + currentStep);
                    }
				}, 100);
			} else {
				engine_this.trigger('finish');
			}
		}
		// announce beginning
		steps[currentStep].activate();
		console.log('Step ' + steps[currentStep].name + ' starting, ' + players.length + ' players total');
		// make necessary actions (via triggers)
		// give players priority starting from current
		asyncLoop(players.length, function(loop) {
			console.log('Trying to give priority to player ' + loop.iteration());
			var currentPlayer_id = loop.iteration();
			players[currentPlayer_id].on('pass', function() {
				loop.next();
			});
			check_SBA();
			players[currentPlayer_id].givePriority();
            engine_this.getView().trigger('priorityGive', players[currentPlayer_id]);
		}, end_step);
	});

    this.on('turnStart', function() {
        // asynchronously looping through steps
        //console.log('Preparing to run through ' + steps.length + ' steps');
        asyncLoop(steps.length, function(loop) {
            var currentStep = loop.iteration();
            console.log('Beginning step ' + currentStep);
            engine_this.trigger('stepStart', loop.next);
            engine_this.getView().trigger('stepStart', currentStep);
        }, function(){ //
            engine_this.getView().trigger('turnEnd');
            engine_this.trigger('turnEnd');
        });
    });

    this.on('turnEnd', function() {
        console.log('Turn has ended');
        engine_this.getView().trigger('turnEnd');
        engine_this.trigger('beginTurn');
    });

    /**
     * This is not a step, just utility function setting values for new turn
     */
    this.on('beginTurn', function() {
        currentPlayer = ((currentPlayer + 1) % (players.length));
        for (var player_id in players) {
            players[player_id].landsToPlay = 1;
        }
        engine_this.getView().trigger('turnStart');
        engine_this.trigger('turnStart');
    });

	var mtg_searcher = function() {
		var set = [];
		// returns player
		this.currentPlayer = function() {
			return players[currentPlayer];
		};
		
		// Filter zones by name
		this.zone = function(name) {
			set = [];
			for (var zone_id in this.zones) {
				if (engine_this.zones.hasOwnProperty(zone_id)) {
					var zone = engine_this.zones[zone_id];
					if (name == '' || zone.getName() == name) {
						set.push(zone);
					}
				}
			}
			
			return this;
		};
		
		// Filter zones by owner
		this.owner = function(player_id) {
			var new_set = [];
			for (var zone_id in set) {
				if (set.hasOwnProperty(zone_id)) {
					if (set[zone_id].owner == players[player_id]) {
						new_set.push(set[zone_id]);
					}
				}
			}
			
			set = new_set;
			return this;
		};
		
		this.eq = function(num) {
			return set[num];
		}
		
		this.length = function() {
			return set.length;
		}
	};

	var mtg = this.mtg = new mtg_searcher;

	this.zones = [];

	var battlefield = new zone('battlefield', false, false);
    this.zones.push(battlefield);
	var exile = [];
	
	this.addPlayer = function(player) {
        // Storing reference to battlefield
        player.setBattlefield(battlefield);
		players.push(player);
		// Should fail if no deck is set
		if (player.deck) {
			this.registerDeck(player.deck, player);
		}
	};

	this.getPlayers = function() {
		return players;
	}

	//Starting first step of first turn
	this.start = function() {
		// This is for playtesting
		if (players.length == 0) {
			var human = new human_player();

			// Create zones
			var library = new zone('library', true, true);
			human.setLibrary(library);
			var hand = new zone('hand', false, true);
			human.setHand(hand);
			var graveyard = new zone('graveyard', true, false);
			human.setGraveyard(graveyard);

			// Create card and put it in library
			var newcard = new card('http://media.wizards.com/images/magic/tcg/products/rtr/4f55hkkypu_ru.jpg', 'Слизень из катакомбы', 'Существо &mdash; Слизь');
			library.place(newcard);
			var newland = new card('http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=225486&type=card', 'Равнина', 'Земля &mdash; Равнина');
			library.place(newland);
            engine_this.addPlayer(human);
            engine_this.addPlayer(new ai_player());
		}

        engine_this.getView().trigger('gameStart', {
            'players': players
        });
		engine_this.trigger('turnStart');
	}
	
	return this;
}

engine.prototype.on = function(event, callback) {
    if (!this.handlers[event]) {
        this.handlers[event] = [];
    }
    this.handlers[event].push(callback);
}

engine.prototype.trigger = function(event, data) {
    var engine_this = this;
    if (this.handlers[event] && this.handlers[event].length > 0) {
        for (var handler_id = 0; handler_id < this.handlers[event].length; handler_id++) {
            this.handlers[event][handler_id].call(engine_this, data);
        }
    }
}

// Register deck for game
engine.prototype.registerDeck = function(deck, player) {
    for (var card_id in deck) {
        if (deck.hasOwnProperty(card_id)) {
            //this.cards.push(deck[card_id]);
            deck[card_id].setOwner(player);
            deck[card_id].setGame(this);
        }
    }
};
