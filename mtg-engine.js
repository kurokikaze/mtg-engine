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
    this.flags = {
        'drawnFromEmptyLibrary' : false
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
    if (this.library.length == 0) {
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
        console.log('Triggered event ' + event + ', ' + this.handlers[event].length + ' handlers found');
        for (var handler_id = 0; handler_id < this.handlers[event].length; handler_id++) {
            console.log('Found registered handler, calling');
            this.handlers[event][handler_id].call();
        }
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

var players = [];

players.push(new human_player());
players.push(new ai_player());

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
    this.element = $('<div/>').css('background-image','url("' + img + '")').attr('title', name).addClass('card');
    this.tapped = false;
    var that = this;
    
    this.goLibrary = function(mode) {
        location = 'library';
        library.place(that, mode);
    };
    
    this.goBattlefield = function() {
        this.trigger('etb');
        if (!this.is_land()) {
            this.tapped = true;
        }
        location = 'battlefield';
        battlefield.place(that);
    };
    
    return this;
};

// Turn structure

var current_step = 0;
var current_player = 0;

var step = function(name) {
    this.name = name;
    this.mandate_actions = [];
    this.element = $('<span/>').attr('id','step_' + this.name.toLowerCase()).text(this.name);
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

var steps = [];

var turn = function() {
	var end_step = function() {
        console.log('Turn ended');
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
	}
	// announce beginning
    steps[current_step].activate();
	console.log('Step ' + steps[current_step].name + ' starting, ' + players.length + ' players total');
	// make necessary actions (via triggers)
	// give players priority starting from current
	asyncLoop(players.length, function(loop) {
        console.log('Trying to give priority to player ' + loop.iteration());
		var current_player_id = loop.iteration();
		players[current_player_id].on('pass', loop.next);
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
        for (var zone_id in window.zones) {
            if (window.zones.hasOwnProperty(zone_id)) {
                var zone = window.zones[zone_id];
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

window.mtg = new mtg_searcher;

window.zones = [];
// mtg.current_player().draw();

$(document).ready(function() {
	// Create zones
	var library = new zone('library', true, true);
	players[0].setLibrary(library);
        window.zones.push(library);
	var hand = new zone('hand', false, true);
	players[0].setHand(hand);
        window.zones.push(hand);
	var graveyard = new zone('graveyard', true, false);
	players[0].setGraveyard(graveyard);
        window.zones.push(graveyard);
	var battlefield = new zone('battlefield', false, false);
        window.zones.push(battlefield);
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


	// Create card and put it in library
	var newcard = new card('http://media.wizards.com/images/magic/tcg/products/rtr/4f55hkkypu_ru.jpg', 'Слизень из катакомбы', 'Существо &mdash; Слизь');
	library.place(newcard);
        var newland = new card('http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=225486&type=card', 'Равнина', 'Земля &mdash; Равнина');
	library.place(newland);

	//Starting first step of first turn
	turn();
});
