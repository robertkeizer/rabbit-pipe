const Main	= require( "../" );
const assert	= require( "assert" );
const Tasks	= require( "./tasks" );

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
} );
