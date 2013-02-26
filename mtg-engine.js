'use strict';

// Utility
Array.prototype.shuffle = function() {
  var i = this.length, j, tempi, tempj;
  if ( i == 0 ) return false;
  while ( --i ) {
     j       = Math.floor( Math.random() * ( i + 1 ) );
     tempi   = this[i];
     tempj   = this[j];
     this[i] = tempj;
     this[j] = tempi;
  }
  return this;
};

function asyncLoop(iterations, func, callback) {
    var index = 0;
    var done = false;
    var loop = {
        'next': function() {
            if (done) {
                return;
            }

            if (index < iterations) {
                index++;
                func(loop);

            } else {
                done = true;
                callback();
            }
        },

        'iteration': function() {
            return index - 1;
        },

        'break': function() {
            done = true;
            callback();
        }
    };
    loop.next();
    return loop;
}

// Classes

/*
 * Player. There can be more than two
 */
var player = function(name) {
    var that = this;
    this.getName = function() { return name; };
    this.handlers = {};
    this.life = 20;
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
    return this;
}

player.prototype.timeoutPriority = function() {
    return true;
}

player.prototype.givePriority = function() {
    return true;
}

player.prototype.draw = function() {
    this.trigger('draw-replace');
    if (this.library.contents.length == 0) {
        this.flags.drawnFromEmptyLibrary = true;
    } else {
        var card = this.library.contents.pop();
        this.hand.place(card);
        this.trigger('draw');
    }
    return true;
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
    console.log('Registering event ' + event);
    if (!this.handlers[event]) {
        this.handlers[event] = [];
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

player.prototype.owns = function(tested_card) {
	if (tested_card instanceof card) {
		return (tested_card.getOwner() == this);
	}
}

player.prototype.removeHandlers = function(event) {
    if (this.handlers[event]) {
        this.handlers[event] = [];
    }
}

var human_player = function() {
    var that = this;
    this.givePriority = function() {
        console.log('Human player got priority');
        var action_pass = $('<li/>').text('[Pass]').addClass('action');
        action_pass.on('click', function() {
            $('#actions').hide();
            that.trigger('pass');
            that.removeHandlers('pass');
            this.remove();
        });
        $("#actions").append(action_pass);
        $("#actions").show();
    }
}

human_player.prototype = new player;

var ai_player = function() {
    var that = this;
    this.givePriority = function() {
        console.log('AI player got priority');
        setTimeout(function() {
		    that.trigger('pass');
            that.removeHandlers('pass');
	    }, 100);
    }
}

ai_player.prototype = new player;

var permanent = function(source_card) {
	this.isToken = false;
	this.representedBy = false;
	this.tapped = false;
	
	this.handlers = {};

	if (source_card instanceof card) {
		this.representedBy = source_card;
	} else { // we're creating a token
		this.isToken = true;
		this.name = source_card.name;
		this.power = source_card.power;
		this.toughness = source_card.toughness; 
	}

	this.getName = function() {
		if (!this.isToken) {
			return this.representedBy.getName();
		} else {
			return this.name;
		}
	}
	return this;
}

permanent.prototype.isTapped = function() {
	return this.tapped;
};

permanent.prototype.tap = function() {
	if (!this.tapped) {
		this.tapped = true;
		this.trigger('tapped');
	} else {
		return false; // should throw something
	}
};

permanent.prototype.untap = function() {
	if (this.tapped) {
		this.tapped = false;
		this.trigger('untaps');
	}
};

permanent.prototype.getManaCost = function() {
	if (this.isToken) {
		return {
			'W':0,
			'U':0,
			'B':0,
			'R':0,
			'G':0,
			'C':0
		}
	} else {
		return this.representedBy.getManaCost();
	}
};

permanent.prototype.on = function(event, callback) {
    if (!this.handlers[event]) {
        this.handlers[event] = [];
    }
    this.handlers[event].push(callback);
}

permanent.prototype.trigger = function(event, data) {
    if (this.handlers[event] && this.handlers[event].length > 0) {
        for (var handler_id = 0; handler_id < this.handlers[event].length; handler_id++) {
            this.handlers[event][handler_id].call();
        }
    }
}

var zone = function(name, ordered, hidden) {
    var element = $('<div/>').attr('id', name + '_zone').addClass('zone');
    this.name = name;
    this.owner = false;
    element.append($('<h4/>').text(name).addClass('zoneName'));
    if (ordered) {
        element.addClass('zone-ordered');
    }
    if (hidden) {
        element.addClass('zone-hidden');
    }
    var that = this;
    $('div#zones').append(element);
    this.place = function(card, mode) {
        switch (mode) {
            case 'bottom':
                that.contents.push(card);
                break;
            case 'shuffle': // shuffle
                that.contents.push(card);
                that.contents.shuffle();
                break;
            default: // 'top'
                that.contents.unshift(card);
        }
        element.append(card.element);
    };
    this.contents = [];
    
    return this;
};

zone.prototype.getName = function() {
    return this.name;
}

zone.prototype.setOwner = function(owner) {
    this.owner = owner;   
}

var card = function(img, name, type) {
    var location = 'library';
    var image = img;
    this.owner = false;
    this.element = $('<div/>').css('background-image','url("' + img + '")').attr('title', name).addClass('card');
    this.tapped = false;
    var that = this;
    this.cost = {
	'W':0,
	'U':0,
	'B':0,
	'R':0,
	'G':0,
	'C':0
    }
    
    this.setManaCost = function(new_cost) {
	if (new_cost.W) this.cost.W = new_cost.W;
	if (new_cost.U) this.cost.U = new_cost.U;
	if (new_cost.B) this.cost.B = new_cost.B;
	if (new_cost.R) this.cost.R = new_cost.R;
	if (new_cost.G) this.cost.G = new_cost.G;
	if (new_cost.C) this.cost.C = new_cost.C;
    }

    this.setOwner = function(owner) {
	if (owner instanceof player) {
		this.owner = owner;
	}
    }

    this.getOwner = function() {
	return this.owner;
    }

    this.getManaCost = function() {
	return this.cost;
    }

    this.getName = function() {
	return name;
    }
	
    this.goLibrary = function(mode) {
        location = 'library';
        library.place(that, mode);
    };
    
    this.goBattlefield = function() {
	var card_permanent = new permanent(this);
        this.trigger('etb');
        if (!this.is_land()) {
            this.tapped = true;
        }
        location = 'battlefield';
	// we're placing permanent on the battlefield,
	// but mark the card as placed there
        battlefield.place(card_permanent);
    };
    
    return this;
};

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
		var end_step = function() {
			console.log('Step ended');
			engine_this.trigger('eop_' + steps[current_step].name);
			if (!engine_this.flags.finished) {
				// Move to the next step
				current_step = ((current_step + 1) % (steps.length));
				// If it's a new turn, make next player active
				if (current_step == 0) {
					current_player = ((current_player + 1) % (players.length));
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

engine.prototype.registerDeck = function(deck, player_id) {
	for (card_id in deck) {
		if (deck.hasOwnProperty(card_id)) {
			this.cards.push(deck[card_id]);
		}
	}
};
