const assert = require( "assert" );

const Main = require( "../" );
const Tasks = require( "./tasks" );

const Events = require( "../src/events" );
const consumerEvents = new Events.Consumer( );

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
} );
