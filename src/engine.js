
var canvas;
var ctx;

var targetDT = 1 / 60;
var globalDT;
var time = 0,
    FPS  = 0,
    frames    = 0,
    acumDelta = 0;

window.requestAnimationFrame = (function (evt) {
    return window.requestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.webkitRequestAnimationFrame ||
        window.msRequestAnimationFrame     ||
        function (callback) {
            window.setTimeout(callback, targetDT * 1000);
        };
}) ();

window.onload = BodyLoaded;

var graphicAssets = {
    player: {
        path: "assets/player.png",
        image: null
    },
    coin: {
        path: "assets/coin.png",
        image: null
    },
    wall: {
        path: "assets/wall.png",
        image: null
    },
    mountain: {
        path: "assets/mountain.png", // https://orig00.deviantart.net/fa75/f/2017/267/3/3/mountain_sprite_001_by_jonata_d-dbogk4i.png
        image: null
    },
    trees: {
        path: "assets/trees.png", // https://forums.rpgmakerweb.com/index.php?threads/whtdragons-trees-recolors.49581/
        image: null
    },
    knight: {
        path: "assets/valiant_knight.png",
        image: null
    },
    block_effect: {
        path: "assets/block_effect.png",
        image: null
    },
    textures: {
        path: "assets/Textures.png",
        image: null
    }
};

var audioAssets = {
    laser: {
        path: "assets/laser.wav",
        audio: null
    }
}

var currentScene = null;

function LoadImages(assets, onloaded)
{
    let imagesToLoad = 0;
    
    const onload = () => --imagesToLoad === 0 && onloaded();

    // iterate through the object of assets and load every image
    for (let asset in assets)
    {
        if (assets.hasOwnProperty(asset))
        {
            imagesToLoad++; // one more image to load

            // create the new image and set its path and onload event
            const img = assets[asset].image = new Image;
            img.src = assets[asset].path;
            img.onload = onload;
        }
     }
    return assets;
}

function LoadAudio(assets)
{
    for (let asset in assets)
    {
        if (assets.hasOwnProperty(asset))
        {
            assets[asset].audio = document.createElement("audio");
            assets[asset].audio.src = assets[asset].path;
            assets[asset].audio.setAttribute("preload", "audio");
            assets[asset].audio.setAttribute("preload", "none");
            assets[asset].audio.display = "none";
            document.body.appendChild(assets[asset].audio);
        }
    }
}

function BodyLoaded()
{
    canvas = document.getElementById("myCanvas");
    ctx = canvas.getContext("2d");

    // setup keyboard & mouse events
    SetupKeyboardEvents();
    SetupMouseEvents();

    PreparePhysics(ctx);

    LoadAudio(audioAssets);

    LoadImages(graphicAssets, function() {
        Start();

        // first call to the game loop
        Loop();
    });
}

function Start()
{
    // initialize the game
    LoadScene(0);
}

function Loop()
{
    //deltaTime
    let now = Date.now();
    let deltaTime = now - time;
    globalDT = deltaTime;

    if (deltaTime > 1000)
        deltaTime = 0;

    time = now;

    // frames counter
    frames++;
    acumDelta += deltaTime;

    if (acumDelta > 1000)
    {
        FPS = frames;
        frames = 0;
        acumDelta -= acumDelta;
    }

    requestAnimationFrame(Loop);

    Input.Update();

    // Game logic -------------------
    Update(deltaTime / 1000);

    // Draw the game ----------------
    Draw(ctx);
    
    // reset input data
    Input.PostUpdate();
}

function Update(deltaTime)
{
    // update physics
    // Step(timestep , velocity iterations, position iterations)
    world.Step(deltaTime, 8, 3);
    world.ClearForces();

    // scene update
    currentScene.Update(deltaTime);

    // check if the scene has ended
    if (currentScene === scene1 && currentScene.finished)
    {
        LoadScene(0);
    }
}

function Draw(ctx)
{
    // clean the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw the game
    currentScene.Draw(ctx);
    
    // draw the FPS
    ctx.fillStyle = "white";
    ctx.font = "10px Comic Sans MS";
    ctx.fillText('FPS: ' + FPS, 10, 16);
    ctx.fillText('DT: ' + Math.round(1000 / globalDT), 10, 28);
}

function DrawBox2dWorld (ctx, world)
{
    // Transform the canvas coordinates to cartesias coordinates
    ctx.save();
    ctx.translate(0, canvas.height);
    ctx.scale(1, -1);
    world.DrawDebugData();
    ctx.restore();
}

function LoadScene(sceneId)
{
    switch (sceneId)
    {
        case 0: // game
            // clean the box2d world
            ClearWorld();
            currentScene = scene1;
            currentScene.Start();
            break;
    }
}
