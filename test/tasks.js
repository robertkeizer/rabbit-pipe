const merge	= require( "merge" );
const Events	= require( "events" );
const uuid	= require( "uuid" );

const Tasks = function( ){
	
};

// Return a valid specification producer config; Note that
// we allow an optional object to be passed in that gets merged
// with the defaults.
Tasks.prototype.validSpecProducerConfig = function( objToMerge ){

	// Define an empty object if one wasn't passed in.
	if( !objToMerge ){ objToMerge = { }; }

	const inputEmitter = new Events.EventEmitter( );
	
	return merge( {
		rabbit: {
			host: "localhost",
			maxQueueLength: 1000,
			queueName: "test-" + uuid.v4()
		},
		inputEmitter: inputEmitter,
	}, objToMerge );
};

module.exports = Tasks;
