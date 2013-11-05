require(['models/mtg-engine']);

$(function(){
	window.game = new engine();
	window.game.start();
});