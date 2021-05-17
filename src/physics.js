// auxiliar code for working with Box2D

// Box2D lib
var b2Vec2 = Box2D.Common.Math.b2Vec2
    ,   b2AABB = Box2D.Collision.b2AABB
    ,   b2BodyDef = Box2D.Dynamics.b2BodyDef
    ,   b2Body = Box2D.Dynamics.b2Body
    ,   b2FixtureDef = Box2D.Dynamics.b2FixtureDef
    ,   b2Fixture = Box2D.Dynamics.b2Fixture
    ,   b2World = Box2D.Dynamics.b2World
    ,   b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
    ,   b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
    ,   b2DebugDraw = Box2D.Dynamics.b2DebugDraw
    ,   b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef
    ,   b2Shape = Box2D.Collision.Shapes.b2Shape
    ,   b2RevoluteJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef
    ,   b2Joint = Box2D.Dynamics.Joints.b2Joint
    ,   b2PrismaticJointDef = Box2D.Dynamics.Joints.b2PrismaticJointDef
    ,   b2DistanceJointDef = Box2D.Dynamics.Joints.b2DistanceJointDef
    ,   b2PulleyJointDef = Box2D.Dynamics.Joints.b2PulleyJointDef
    ;

// 1 meter = 100 pixels
var scale = 100;
var gravity;
var world;

// aux function for creating boxes
function CreateBox (world, x, y, width, height, options)
{
    // default values
    let defaultOptions = {
    	density : 1.0,
    	friction: 1.0,
    	restitution : 0.5,
		isSensor: false,
 
    	linearDamping : 0.0,
    	angularDamping: 0.0,
    	fixedRotation : true,
		
    	type : b2Body.b2_dynamicBody
    }
    options = Object.assign(defaultOptions, options);

    // Fixture: define physics properties (density, friction, restitution)
	let fix_def = new b2FixtureDef();
 
	fix_def.density = options.density;
	fix_def.friction = options.friction;
	fix_def.restitution = options.restitution;
	fix_def.isSensor = options.isSensor;
 
	// Shape: 2d geometry (circle or polygon)
	fix_def.shape = new b2PolygonShape();
 
	fix_def.shape.SetAsBox(width, height);

    // Body: position of the object and its type (dynamic, static o kinetic)
	let body_def = new b2BodyDef();
	body_def.position.Set(x, y);
 
	body_def.linearDamping = options.linearDamping;
	body_def.angularDamping = options.angularDamping;
	body_def.fixedRotation = options.fixedRotation;
 
	body_def.type = options.type; // b2_dynamicBody
	body_def.userData = options.user_data;
 
	let b = world.CreateBody(body_def);
	let f = b.CreateFixture(fix_def);
 
	return b;
}

// aux function for creating balls
function CreateBall (world, x, y, radius, options)
{
	// default values
    let defaultOptions = {
    	density : 1.0,
    	friction: 1.0,
    	restitution : 0.5,
		isSensor: false,
 
    	linearDamping : 0.1,
    	angularDamping: 0.1,
		fixedRotation : true,
 
    	type : b2Body.b2_dynamicBody
    }
	options = Object.assign(defaultOptions, options);
	
    let fix_def = new b2FixtureDef;

	fix_def.density = options.density;
	fix_def.friction = options.friction;
	fix_def.restitution = options.restitution;
	fix_def.isSensor = options.isSensor;

    // Shape: 2d geometry (circle or polygon)
    let shape = new b2CircleShape(radius);
	fix_def.shape = shape;
	
    let body_def = new b2BodyDef();
	body_def.position.Set(x, y);

    // friction
	body_def.linearDamping = options.linearDamping;
	body_def.angularDamping = options.angularDamping;
	body_def.fixedRotation = options.fixedRotation;

    body_def.type = options.type;
    body_def.userData = options.user_data;

    let b = world.CreateBody(body_def);
    let f = b.CreateFixture(fix_def);

    return b;
}

// Create a Box2D world object
function CreateWorld(ctx, gravity)
{
	var doSleep = false;
	var world = new b2World(gravity, doSleep);
 
	// DebugDraw is used to create the drawing with physics
	var debugDraw = new b2DebugDraw();
	debugDraw.SetSprite(ctx);
	debugDraw.SetDrawScale(scale);
	debugDraw.SetFillAlpha(0.5);
	debugDraw.SetLineThickness(1.0);
	debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
 
	world.SetDebugDraw(debugDraw);
 
	return world;
}

function PreparePhysics(ctx)
{
    // create the gravity vector("down" with force 10)
    gravity = new b2Vec2(0, -20);

    // create the world
	world = CreateWorld(ctx, gravity);
	
	// prepare the collision event function
    Box2D.Dynamics.b2ContactListener.prototype.BeginContact = OnContactDetected;
}

function OnContactDetected (contact)
{
    var a = contact.GetFixtureA().GetBody().GetUserData();
    var b = contact.GetFixtureB().GetBody().GetUserData();

    if (a != null && b != null &&
        typeof(a.type) !== 'undefined' &&
        typeof(b.type) !== 'undefined')
    {
		console.log("collision between " + a.type + " and " + b.type);
		
		// check player-coin collision
		let coin = null;
		if (b.type === "coin")
			coin = b;
		if (a.type === "coin")
			coin = a;

		let player = null;
		if (b.type === "player")
			player = b;
		if (a.type === "player")
			player = a;

		let floor = null;
		if (b.type === "floor")
			floor = b;
		if (a.type === "floor")
			floor = a;

		if (floor != null && player != null)
		{
			player.OnFloor();
		}

		if (coin != null && player != null)
		{
			player.score += coin.points;

			// mark the coin to be deleted in the next update
			coin.toDelete = true;
		}
    }
}

function ClearWorld()
{
	let body = world.GetBodyList();
	while (body !== null)
	{
		world.DestroyBody(body);
		body = body.GetNext();
	}
}
