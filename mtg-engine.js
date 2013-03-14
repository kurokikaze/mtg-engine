'use strict';
// Turn structure

var step = function(name) {
    this.name = name;
    this.mandate_actions = [];
    this.element = $('<span/>').attr('id','step_' + this.name.toLowerCase()).text(this.name);
	console.log('Creating step ' + name);
    $('#steps').append(this.element);
    this.activate = function() {
        // Clear all steps
        $('#steps span').removeClass('active');
        // Set current step in UI
        this.element.addClass('active');
        // Apply mandatory actions
        for (var i = 0; i <= this.mandate_actions.length; i++) {
            if (this.mandate_actions[i] && typeof this.mandate_actions[i] == 'function') {
                this.mandate_actions[i]();
            }
        }
    };
};

step.prototype.addAction = function(action) {
    this.mandate_actions.push(action);
    return this;
}

var engine = function() {
	var steps = [];

	var engine_this = this;
	
	this.handlers = [];

	var current_step = 0;
	var current_player = 0;

	var players = [];

	this.cards = [];

	this.flags = {};

	var stack = new stack_object();

	// Check state-based actions
	var check_SBA = function() {
		for (var player_id in players) {
			if (players.hasOwnProperty(player_id)) {
				if (players[player_id].life <= 0) {
					players[player_id].flags['lost'] = true;
					engine_this.trigger('player_lost', players[player_id]);
				}
			}
		}

		for (var player_id in players) {
			if (players.hasOwnProperty(player_id)) {
				if (players[player_id] && players[player_id].flags['won'] == true) {
					this.flags.finished = true;
				}
			}
		}
	}

	var turn = function() {
        var start_turn = function() {
            for (var player_id in players) {
                players[player_id].landsToPlay = 1;
            }
        }

		var end_step = function() {
			console.log('Step ended');
			engine_this.trigger('eop_' + steps[current_step].name);
			if (!engine_this.flags.finished) {
				// Move to the next step
				current_step = ((current_step + 1) % (steps.length));
				// If it's a new turn, make next player active
				if (current_step == 0) {
					current_player = ((current_player + 1) % (players.length));
                    start_turn();
				}
				console.log('Setting timeout for new turn');
				setTimeout(function() {
					console.log('New turn starting');
					turn();
				}, 100);
			} else {
				engine_this.trigger('finish');
			}
		}
		// announce beginning
		steps[current_step].activate();
		console.log('Step ' + steps[current_step].name + ' starting, ' + players.length + ' players total');
		// make necessary actions (via triggers)
		// give players priority starting from current
		asyncLoop(players.length, function(loop) {
			console.log('Trying to give priority to player ' + loop.iteration());
			var current_player_id = loop.iteration();
			players[current_player_id].on('pass', function() {
				loop.next();
			});
			check_SBA();
			players[current_player_id].givePriority();
		}, end_step);
	};

	var mtg_searcher = function() {
		var set = [];
		// returns player
		this.current_player = function() {
			return players[current_player];
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
	
	steps.push(new step('Untap'));
	steps.push(new step('Upkeep'));
	steps.push(new step('Draw').addAction(function() { mtg.current_player().draw();}));
	steps.push(new step('Precombat Main'));
	steps.push(new step('Beginning of Combat'));
	steps.push(new step('Declare Attackers'));
	steps.push(new step('Declare Blockers'));
	steps.push(new step('Combat Damage'));
	steps.push(new step('End of Combat'));
	steps.push(new step('Post-Combat Main'));
	steps.push(new step('End'));
	steps.push(new step('Cleanup'));

	this.addPlayer = function(player) {
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
			players.push(new human_player());
			players.push(new ai_player());

			// Create zones
			var library = new zone('library', true, true);
			players[0].setLibrary(library);
			this.zones.push(library);
			var hand = new zone('hand', false, true);
			players[0].setHand(hand);
			this.zones.push(hand);
			var graveyard = new zone('graveyard', true, false);
			players[0].setGraveyard(graveyard);
			this.zones.push(graveyard);

			// Create card and put it in library
			var newcard = new card('http://media.wizards.com/images/magic/tcg/products/rtr/4f55hkkypu_ru.jpg', 'Слизень из катакомбы', 'Существо &mdash; Слизь');
			library.place(newcard);
			var newland = new card('http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=225486&type=card', 'Равнина', 'Земля &mdash; Равнина');
			library.place(newland);

		}
		turn();
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
    if (this.handlers[event] && this.handlers[event].length > 0) {
        for (var handler_id = 0; handler_id < this.handlers[event].length; handler_id++) {
            this.handlers[event][handler_id].call();
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
