/*
	This file may seem like overkill, but it ensures that all modules
	only emit events that are define here. This is the source of truth
	for events being emitted by the producer or consumer.
*/

const ProducerEvents = function( ){
	
};

ProducerEvents.prototype.readyToStart = function( ){
	return "readyToStart";
};

ProducerEvents.prototype.startCalledWhenAlreadyRunning = function( ){
	return [ "error", "Start called when already Running" ];
};

ProducerEvents.prototype.startingUp = function( ){
	return "startingUp";
};

ProducerEvents.prototype.running = function( ){
	return "running";
};

ProducerEvents.prototype.dying = function( ){
	return "dying";
};

ProducerEvents.prototype.handledData = function( ){
	return "handledData";
};

ProducerEvents.prototype.noreplyOnCheckQueue = function( reply ){
	let _return = [ "error" ];

	if( reply ){
		_return.push( "Check Queue Length Loop error: No reply back." );
	}else{
		_return.push( "Check Queue Length Loop error: Didn't find messageCount in " + JSON.stringify( reply ) );
	}

	return _return;
};

module.exports = {
	Producer: ProducerEvents
}
