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
    
    this.stepDelay = 50;

    this.verbose = false;

    var log = function(text) {
        if (engine_this.verbose) {
            console.log(engine_this.verbose + ' ' + text);
        }
    }

	var stack = new stack_object();

    if (!step && !window.step) {
        log('Step module is not loaded');
    }

    this.getView = function() {
        return view;
    }

    // Steps
	steps.push(new step('Untap'));
	steps.push(new step('Upkeep'));
	steps.push(new step('Draw').addAction(function() { mtg.currentPlayer().draw();}));
	steps.push(new step('Precombat Main').setMain(true));
	steps.push(new step('Beginning of Combat'));
	steps.push(new step('Declare Attackers'));
	steps.push(new step('Declare Blockers'));
	steps.push(new step('Combat Damage'));
	steps.push(new step('End of Combat'));
	steps.push(new step('Post-Combat Main').setMain(true));
	steps.push(new step('End'));
	steps.push(new step('Cleanup'));

	// Check state-based actions
	var check_SBA = function() {
        log('Checking state-based actions');
		for (var player_id in players) {
			if (players.hasOwnProperty(player_id)) {
                var checked_player = players[player_id];
				if (checked_player.life <= 0) {
                    log('player has 0 life');
					checked_player.flags['lost'] = true;
					engine_this.trigger('player_lost', checked_player);
				}
                if (checked_player.flags['won'] == true) {
                    log('player has won');
					engine_this.flags.finished = true;
				}
                if (checked_player.flags['drawnFromEmptyLibrary'] == true && engine_this.flags['canDrawFromEmptyLibrary'] != true) {
                    log('Player has drawn from empty library and will be terminated');
                    engine_this.flags.finished = true;
                    engine_this.trigger('player_lost', checked_player);
                }
			}
		}
        if (engine_this.flags.finished == true) {
            log('SBA checked, game is finishing');
        } else {
            log('SBA checked')
        }

		/*for (var player_id in players) {
			if (players.hasOwnProperty(player_id)) {
				
			}
		}*/
	}

    this.getCurrentStep = function() {
        return steps[currentStep];
    };

    // Concede action. Useful for testing
    // Right now it doesn't uses stack, but uses SBA, which is not right
    this.concede = function(player) {
        player.flags['lost'] = true;
        if (players.length == 2) {
            engine_this.flags.finished = true;
        }
    }

    this.on('player_lost', function() {
        if (players.length <= 2) {
            // this.trigger('finish');
            engine_this.flags.finished = true;
        }
    });

    this.on('stepStart', function(nextStepCallback) {
		var end_step = function() {
			if (!engine_this.flags.finished) {
                log('Step ' + steps[currentStep].name + ' ended');
                engine_this.trigger('eos_' + steps[currentStep].name);
				// Move to the next step
				log('Setting timeout for new turn');
				setTimeout(function() {
					log('New step starting');
                    // we cannot trigger here w/o reworking how step system handles 
                    // async player input
                    if (nextStepCallback) {
                        nextStepCallback();
                    } else {
                        log('Current player is ' + currentPlayer + ', current step is ' + currentStep);
                    }
				}, engine_this.stepDelay);
			} else {
                log('Game is finishing')
				engine_this.trigger('finish');
			}
		}
		// announce beginning
        log('Inside stepStart, currentStep is ' + currentStep);
        engine_this.trigger('stepStart#triggers');
		steps[currentStep].activate();
		log('Step ' + steps[currentStep].name + ' starting, ' + players.length + ' players total');
		// make necessary actions (via triggers)
		// give players priority starting from current
		asyncLoop(players.length, function(loop) {
			log('Trying to give priority to player ' + loop.iteration());
			var currentPlayer_id = loop.iteration();
			players[currentPlayer_id].on('pass', function() {
                players[currentPlayer_id].clearEvent('pass');
				loop.next();
			});
			check_SBA();
            if (engine_this.flags.finished == true) {
                log('Engine is shutting down, breaking players loop');
                loop.break();
            } else {
			    players[currentPlayer_id].givePriority.call(engine_this);
                engine_this.getView().trigger('priorityGive', players[currentPlayer_id]);
            }
		}, end_step);
	});

    this.on('turnStart', function() {
        // asynchronously looping through steps
        log('Preparing to run through ' + steps.length + ' steps');
        asyncLoop(steps.length, function(loop) {
            currentStep = loop.iteration();
            // log('Beginning step ' + currentStep);
            engine_this.trigger('stepStart', loop.next);
            engine_this.getView().trigger('stepStart', currentStep);
        }, function(){ //
            engine_this.getView().trigger('turnEnd');
            engine_this.trigger('turnEnd');
        });
    });

    this.on('turnEnd', function() {
        log('Turn has ended');
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
			for (var zone_id in engine_this.zones) {
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
    battlefield.setGame(engine_this);
    this.zones.push(battlefield);
	var exile = [];
	
    this.playLand = function(player, card) {
        log('Player ' + player.name + ' intends to play ' + card.getName() + ' as land');
        log('Player has ' + player.landToPlay + ' land(s) to play left this turn');
        if (card.getOwner() == player &&
        player.landToPlay > 0 &&
        engine_this.getCurrentStep().isMain()
        ) {
            card.goBattlefield();
            player.landToPlay--;
            return true;
        }
        return false;
    }

	this.addPlayer = function(player) {
        // Storing reference to battlefield
        player.setBattlefield(battlefield);

        // Registering zones to the game
        // This should be done differently. Player has only his deck when assigned
        // to the game. His zones are created in this function
		if (player.deck) {
			this.registerDeck(player.deck, player);
		}

        if (!player.library) {
            log('Player ' + player.getName() + ' has no library declared, his deck is set as his library');
            player.setLibrary(new zone(player.getName() + '`s library', true, true));
            player.library.contents = player.deck;
        }
        player.library.setGame(engine_this);

        if (!player.hand) {
            player.setHand(new zone(player.getName() + '`s hand', true, true));
        }
        player.hand.setGame(engine_this);

        if (!player.graveyard) {
            player.setGraveyard(new zone(player.getName() + '`s graveyard', true, true));
        }
        player.graveyard.setGame(engine_this);

		players.push(player);
		// Should fail if no deck is set
	};

	this.getPlayers = function() {
		return players;
	}

	//Starting first step of first turn
	this.start = function() {
		// This is for playtesting
		if (players.length == 0) {
            console.log('Attention, creating human player!');
			var human = new ai_player();

			// Create zones
			var library = new zone('library', true, true);
            library.setGame(engine_this);
			human.setLibrary(library);
			var hand = new zone('hand', false, true);
            hand.setGame(engine_this);
			human.setHand(hand);
			var graveyard = new zone('graveyard', true, false);
            graveyard.setGame(engine_this);
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
        engine_this.trigger('gameStart'); // announce start
        engine_this.trigger('gameStart#triggers');
		engine_this.trigger('turnStart');
	}
	
	return this;
};

engine.prototype.on = function(event, callback) {
    if (!this.handlers[event]) {
        this.handlers[event] = [];
    }
    if (this.handlers[event].length > 3) {
        log('Engine event "' + event + '" has too many handlers');
    }
    this.handlers[event].push(callback);
};

engine.prototype.trigger = function(event, data) {
    var engine_this = this;
    if (this.handlers[event] && this.handlers[event].length > 0) {
        for (var handler_id = 0; handler_id < this.handlers[event].length; handler_id++) {
            this.handlers[event][handler_id].call(engine_this, data);
        }
    }
};

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
