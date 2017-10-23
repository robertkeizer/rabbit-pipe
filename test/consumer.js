const assert = require( "assert" );

const events = require( "events" );
const event2stream = require( "event2stream" );

const Main = require( "../" );
const Tasks = require( "./tasks" );

const Events = require( "../src/events" );
const producerEvents = new Events.Producer( );
const consumerEvents = new Events.Consumer( );

const uuid = require( "uuid" );

describe( "Consumer", function( ){
	it( "Is a function", function( ){
		assert.ok( typeof( Main.Consumer ) == "function" );
	} );

	it( "Fails with an invalid config", function( ){
		assert.throws( function( ){
			const consumer = new Main.Consumer( );
		} );
	} );

	it( "Emits an error if could connect to the rabbit instance", function( cb ){
		const tasks = new Tasks( );
		const consumer = new Main.Consumer( tasks.validSpecForConsumer( {
			rabbit: {
				host: "doesnotexisthostrandomonetwothree"
			}
		} ) );
		consumer.on( "error", function( err ){
			return cb( null );
		} );
	} );

	it( "Emits running if it can connect to rabbit", function( cb ){
		const tasks = new Tasks( );
		const consumer = new Main.Consumer( tasks.validSpecForConsumer( ) );
		consumer.on( consumerEvents.running( ), function( ){
			return cb( null );
		} );
	} );

	it( "Emits handledData events when it gets data", function( cb ){

		const tasks = new Tasks( );

		const _messageToPass = "This is a mesasge to pass; " + uuid.v4();

		const _ee = new events.EventEmitter( );
		const inputStream = new event2stream( {
			eventEmitter: _ee,
			eventNames: [ "data" ]
		} );

		const _producerConfig = tasks.validSpecProducerConfig( {
			waitForReadyListener: true,
			autoStart: true,
			eventNamesToListenTo: [ "data" ],
			inputStream: inputStream,
			rabbit: {
				maxQueueLength: 1000,
				checkQueueFrequency: 10,
				deleteQueueOnDeath: true
			}
		} );

		const p = new Main.Producer( _producerConfig );

		const _consumerConfig = tasks.validSpecForConsumer( {
			rabbit: {
				queueName: _producerConfig.rabbit.queueName
			}
		} );

		// Just a simple function to start the consumer..
		const letsGo = function( ){
			c = new Main.Consumer( _consumerConfig );
		};

		_consumerConfig.outputStream.on( "newListener", function( eventName ){
			if( eventName == "data" ){
				letsGo( );
			}
		} );

		// Yes this is hacky, I should go back and 
		// work on this test at some point. 'c' represents
		// the consumer instance, and is set in letsGo() below.
		let c = undefined;

		const die = function( ){
			p.die();
			c.die();
			return cb( null );
		};

		// Note that we're hacking the output stream a bit in that
		// in our Tasks we have a _write function defined that turns
		// writes into a 'data' event that we can handle in this fashion.
		_consumerConfig.outputStream.on( "data", function( data ){
			assert.equal( data.chunk.toString(), _messageToPass );
			die( );
		} );

		// Shove stuff into the rabbit queue as soon as we're
		// ready to go.
		p.once( producerEvents.readyToStart( ), function( ){
			_ee.emit( "data", _messageToPass );
		} );
	} );
} );
