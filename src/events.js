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

module.exports = {
	Producer: ProducerEvents
}
