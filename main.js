require.config({
  'paths': {
    'jquery': 'libraries/jquery',
    'underscore': 'libraries/underscore',
    'backbone': 'libraries/backbone',
    'engine': 'models/mtg-engine'
  }
});

require(['engine'], function(Engine) {	
	game = new Engine();
	game.start();
});