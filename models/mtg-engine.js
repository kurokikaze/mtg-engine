define([
	'/models/View.js',
	'/models/step.js',
	'/models/player.js',
	'/models/stack.js',
    '/models/zone.js',
], function(View, Step, Player, Stack, Zone) {
	var Engine = Backbone.Model.extend({
		steps: [],
		handlers: [],
		currentStep: 0,
		currentPlayer: 0,
		view: false,
		players: [],
		cards: [],
		flags: [],
		zones: [],
		stepDelay: 50,
		verbose: false,
		stack: false,
		getView: function() {
			return this.view;
		},
		log: function(text) {
			if (this.verbose) {
				console.log(this.verbose + ' ' + text);
			}
		},
        // Создаём фазы хода
		createSteps: function() {
			this.steps.push(new Step('Untap', this));
			this.steps.push(new Step('Upkeep', this));
			this.steps.push(new Step('Draw', this).addAction(function() { 
				this.getCurrentPlayer().draw(); 
			}));
			this.steps.push(new Step('Precombat Main', this).setMain(true));
			this.steps.push(new Step('Beginning of Combat', this));
			this.steps.push(new Step('Declare Attackers', this));
			this.steps.push(new Step('Declare Blockers', this));
			this.steps.push(new Step('Combat Damage', this));
			this.steps.push(new Step('End of Combat', this));
			this.steps.push(new Step('Post-Combat Main', this).setMain(true));
			this.steps.push(new Step('End', this));
			this.steps.push(new Step('Cleanup', this));
		},
        getCurrentPlayer: function() {
			return this.players[this.currentPlayer];
		},
		// Проверяем State-Based Actions. Здесь игра может внезапно закончиться (для одного игрока либо для всех).
		checkSBA: function() {
			this.log('Checking state-based actions');
			for (var player_id in this.players) {
				var checked_player = this.players[player_id];
				if (checked_player.life <= 0) {
					this.log('player has 0 life');
					checked_player.flags['lost'] = true;
					this.trigger('player_lost', checked_player);
				}
				if (checked_player.flags['won'] == true) {
					this.log('player has won');
					this.flags.finished = true;
				}
				if (checked_player.flags['drawnFromEmptyLibrary'] == true && Engine_this.flags['canDrawFromEmptyLibrary'] != true) {
					this.log('Player has drawn from empty library and will be terminated');
					this.flags.finished = true;
					this.trigger('player_lost', checked_player);
				}
			}
			if (this.flags.finished == true) {
				this.log('SBA checked, game is finishing');
			} else {
				this.log('SBA checked')
			}
		},
        // Получаем текущую фазу хода
		getCurrentStep: function() {
			return this.steps[this.currentStep];
		},
        // Сдаться. Это немедленно выводит игрока из игры. Это действие *не должно* использовать ни стек, ни SBA.
		concede: function(player) {
			player.flags['lost'] = true;
			if (this.players.length == 2) {
				this.flags.finished = true;
			}
		},
		mtg_searcher: function() {
			/* придётся переписать */
		},
		setModelEvents: function() {
			this.on('player_lost', function() {
				if (this.players.length <= 2) {
					// this.trigger('finish');
					this.flags.finished = true;
				}
			}.bind(this));

			this.on('stepStart', function(nextStepCallback) {
				var end_step = function() {
					if (!Engine_this.flags.finished) {
						this.log('Step ' + steps[currentStep].name + ' ended');
						Engine_this.trigger('eos_' + steps[currentStep].name);
						// Move to the next step
						this.log('Setting timeout for new turn');
						setTimeout(function() {
							log('New step starting');
							// we cannot trigger here w/o reworking how step system handles 
							// async player input
							if (nextStepCallback) {
								nextStepCallback();
							} else {
								log('Current player is ' + this.currentPlayer + ', current step is ' + this.getCurrentStep());
							}
						}, Engine_this.stepDelay);
					} else {
						this.log('Game is finishing')
						Engine_this.trigger('finish');
					}
				}
				// announce beginning
				this.log('Inside stepStart, currentStep is ' + this.getCurrentStep());
				this.trigger('stepStart#triggers');
				this.getCurrentStep().activate();
				this.log('Step ' + this.getCurrentStep().get('name') + ' starting, ' + this.players.length + ' players total');
				// make necessary actions (via triggers)
				// give players priority starting from current
				asyncLoop(this.players.length, function(loop) {
					this.log('Trying to give priority to player ' + loop.iteration());
					var currentPlayer_id = loop.iteration();
					this.players[currentPlayer_id].on('pass', function() {
						this.players[currentPlayer_id].clearEvent('pass');
						loop.next();
					}.bind(this));
					this.check_SBA();
					if (this.flags.finished == true) {
						this.log('Engine is shutting down, breaking players loop');
						loop.break();
					} else {
						this.players[currentPlayer_id].givePriority.call(this);
						this.getView().trigger('priorityGive', this.players[currentPlayer_id]);
					}
				}.bind(this), end_step);
			}.bind(this));
		
			this.on('turnStart', function() {
				// asynchronously looping through steps
				this.log('Preparing to run through ' + this.steps.length + ' steps');
				asyncLoop(this.steps.length, function(loop) {
					currentStep = loop.iteration();
					// log('Beginning step ' + currentStep);
					this.trigger('stepStart', loop.next);
					this.getView().trigger('stepStart', this.getCurrentStep());
				}.bind(this), function(){ //
					this.getView().trigger('turnEnd');
					this.trigger('turnEnd');
				}.bind(this));
			}.bind(this));

			this.on('turnEnd', function() {
				this.log('Turn has ended');
				Engine_this.getView().trigger('turnEnd');
				Engine_this.trigger('beginTurn');
			});

			/**
			 * This is not a step, just utility function setting values for new turn
			 */
			this.on('beginTurn', function() {
				this.currentPlayer = ((this.currentPlayer + 1) % (this.players.length));
				for (var player_id in this.players) {
					this.players[player_id].landsToPlay = 1;
				}
				this.getView().trigger('turnStart');
				this.trigger('turnStart');
			}.bind(this));
		},
        // Создаём игровые зоны
		createZones: function() {
			var battlefield = new Zone('battlefield', false, false);
			battlefield.setGame(this);
			this.zones.push(battlefield);
			this.battlefield = battlefield;
			var exile = [];
		},
        // Регистрируем колоду для участия в игре (нужно то же самое для сайдборда)
		registerDeck: function(deck, player) {
			for (var card_id in deck) {
				if (deck.hasOwnProperty(card_id)) {
					//this.cards.push(deck[card_id]);
					deck[card_id].set('owner', player);
					deck[card_id].set('game', this);
				}
			}
		},
		getPlayers: function() {
			return this.players;
		},
        // Добавляем игрока к текущей игре
		addPlayer: function(new_player) {
			// Storing reference to battlefield
			new_player.setBattlefield(this.battlefield);

			// Registering zones to the game
			// This should be done differently. Player has only his deck when assigned
			// to the game. His zones are created in this function
			if (new_player.get('deck')) {
				this.registerDeck(new_player.get('deck'), new_player);
			}

			if (!new_player.library) {
				this.log('Player ' + new_player.getName() + ' has no library declared, his deck is set as his library [' + new_player.get('deck').length + ' card(s)]');
				new_player.setLibrary(new Zone(new_player.getName() + '`s library', true, true));
				new_player.library.set('contents', new_player.get('deck'));
			}
			new_player.library.setGame(this);

			if (!new_player.hand) {
				new_player.setHand(new Zone(new_player.getName() + '`s hand', true, true));
			}
			new_player.hand.setGame(this);

			if (!new_player.graveyard) {
				new_player.setGraveyard(new Zone(new_player.getName() + '`s graveyard', true, true));
			}
			new_player.graveyard.setGame(this);

			this.players.push(new_player);
			// Should fail if no deck is set
		},

		//Starting first step of first turn
		start: function() {
			// This is for playtesting
			if (this.players.length == 0) {
				console.log('Attention, creating human player!');
				var human = new ai_player();

				// Create zones
				var library = new Zone('library', true, true);
				library.setGame(this);
				human.setLibrary(library);
				var hand = new Zone('hand', false, true);
				hand.setGame(this);
				human.setHand(hand);
				var graveyard = new Zone('graveyard', true, false);
				graveyard.setGame(this);
				human.setGraveyard(graveyard);

				// Create card and put it in library
				var newcard = new card('http://media.wizards.com/images/magic/tcg/products/rtr/4f55hkkypu_ru.jpg', 'Слизень из катакомбы', 'Существо &mdash; Слизь');
				library.place(newcard);
				var newland = new card('http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=225486&type=card', 'Равнина', 'Земля &mdash; Равнина');
				library.place(newland);
				Engine_this.addPlayer(human);
				Engine_this.addPlayer(new ai_player());
			}

			this.getView().trigger('gameStart', {
				'players': this.players
			});
			this.trigger('gameStart'); // announce start
			this.trigger('gameStart#triggers');
			this.trigger('turnStart');
		},

		initialize: function() {

			var engine_this = this;
			
			this.view = new View(this);
			
			this.stack = new Stack();
			
			// Steps
			this.createSteps();

			//var mtg = this.mtg = new mtg_searcher;

			this.zones = [];

			this.players = [];
			// Это должно быть действием карты
			
			this.setModelEvents();
			//return this;
		},
		playLand: function(player, card) {
				this.log('Player ' + player.name + ' intends to play ' + card.getName() + ' as land');
				this.log('Player has ' + player.landToPlay + ' land(s) to play left this turn');
				if (card.getOwner() == player &&
				player.landToPlay > 0 &&
				Engine_this.getCurrentStep().isMain()
				) {
					card.goBattlefield();
					player.landToPlay--;
					return true;
				}
				return false;
			}
	});

	// Register deck for game
	
	return Engine;
});