const Main	= require( "../" );
const assert	= require( "assert" );
const Tasks	= require( "./tasks" );

const events	= require( "events" );

const ProducerEvents	= require( "../src/events" ).Producer;
const producerEvents	= new ProducerEvents( );

describe( "Producer", function( ){
	it( "Is a function", function( ){
		assert.ok( typeof( Main.Producer ) == "function" );
	} );

	it( "Throws an error if config not specified", function( ){
		assert.throws( function( ){
			const p = new Main.Producer( );
		} );
	} );

	it( "Doesn't throw an error if config is passed in", function( ){
		const tasks = new Tasks( );
		const p = new Main.Producer( tasks.validSpecProducerConfig( ) );
	} );

	it( "The Producer inherits from the event emitter", function( ){
		const tasks = new Tasks( );
		const p = new Main.Producer( tasks.validSpecProducerConfig( ) );
		assert.ok( p instanceof events.EventEmitter );
	} );

	it( "The producer emits a ready to start event when ready to start", function( cb ){
		const tasks = new Tasks( );
		const p = new Main.Producer( tasks.validSpecProducerConfig( { waitForReadyListener: true } ) );
		p.once( producerEvents.readyToStart( ), function( ){
			return cb( null );
		} );
	} );
} );
