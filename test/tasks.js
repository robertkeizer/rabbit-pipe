const merge	= require( "merge" );
const Events	= require( "events" );
const stream	= require( "stream" );
const uuid	= require( "uuid" );

const Tasks = function( ){
	
};

// Return a valid specification producer config; Note that
// we allow an optional object to be passed in that gets merged
// with the defaults.
Tasks.prototype.validSpecProducerConfig = function( objToMerge ){

	// Define an empty object if one wasn't passed in.
	if( !objToMerge ){ objToMerge = { }; }

	const inputStream = new stream.Writable( );
	
	return merge.recursive( {
		rabbit: {
			host: "localhost",
			maxQueueLength: 1000,
			queueName: "test-" + uuid.v4()
		},
		inputStream: inputStream,
	}, objToMerge );
};

Tasks.prototype.validSpecForConsumer = function( objToMerge ){
	if( !objToMerge ){ objToMerge = { }; }

	const outputStream = new stream.Writable( );

	return merge.recursive( {
		rabbit: {
			host: "localhost",
			queueName: "incoming"
		},
		outputStream: outputStream,
		autoStart: true
	}, objToMerge );
};

module.exports = Tasks;
