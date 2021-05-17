
var scene1 = {

    gameObjects: [],

    player: null,
    camera: null,
    coins: [],
    platforms: [],

    finished: false,

    Start : function () {
        this.gameObjects = [];

        // create platforms
        //this.platforms = [];
        /*let newPlatform = new Platform({x: 500, y: 520}, 256, 62);
        newPlatform.Start();
        this.platforms.push(newPlatform);

        let newPlatform2 = new Platform({x: 800, y: 400}, 256, 62);
        newPlatform2.Start();
        this.platforms.push(newPlatform2);*/

        this.finished = false;

        // create the player
        this.player = new Player();
        this.gameObjects.push(this.player);

        // create the camera
        this.camera = new Camera(this.player);

        // create some coins
        this.coins = [];
        let newCoin = new Coin({x: 400, y: 450});
        this.coins.push(newCoin);
        this.gameObjects.push(newCoin);

        let newCoin2 = new Coin({x: 1300, y: 350});
        this.coins.push(newCoin2);
        this.gameObjects.push(newCoin2);

        // initialize dinamic game objects
        this.gameObjects.forEach(gameObject => gameObject.Start());

        // create some objects for the world
        // left wall
        CreateBox(world, 0, 1, .1, 8, {
            type : b2Body.b2_staticBody,
            friction: 0
        });
        // down wall (floor)
        CreateBox(world, 8, -0.1, 16, .25, {
            type : b2Body.b2_staticBody, 
            user_data: {type: "floor"}
        });
        // right wall
        CreateBox(world, 16, 1, .1, 8, {
            type : b2Body.b2_staticBody,
            friction: 0
        });

        // initialize background
        background.Start();
    },

    Update : function (deltaTime) {
        //this.gameObjects.forEach(gameObject => gameObject.Update(deltaTime));
        
        // update the player
        this.player.Update(deltaTime);

        // coins update
        for (let i = 0; i < this.coins.length; i++)
        {
            this.coins[i].Update(deltaTime);
            if (this.coins[i].toDelete)
            {            
                world.DestroyBody(this.coins[i].body);
                RemoveElementAt(this.coins, i);
                i--;

                if (this.coins.length == 0)
                {
                    // last coint, reset scene
                    this.finished = true;
                }
            }
        }

        // update the camera
        this.camera.Update(deltaTime);
    },

    Draw : function (ctx) {
        //this.gameObjects.forEach(gameObject => gameObject.Draw(ctx));
        
        // draw the background layers
        background.Draw(ctx, currentScene.camera);

        // camera pre-draw
        this.camera.PreDraw();

        // draw the box2d world
        DrawBox2dWorld(ctx, world);

        // platforms
        for (let i = 0; i < this.platforms.length; i++)
            this.platforms[i].Draw(ctx);

        // draw the player
        this.player.Draw(ctx);

        // draw the coins 
        for (let i = 0; i < this.coins.length; i++)
            this.coins[i].Draw(ctx);

        // floor tiles
        ctx.imageSmoothingEnabled = false;
        ctx.save();
        ctx.scale(3, 3);
        ctx.drawImage(graphicAssets.textures.image, 313, 94, 120, 110, 0, 194, 120, 110);
        ctx.drawImage(graphicAssets.textures.image, 313, 94, 120, 110, 120, 194, 120, 110);
        ctx.drawImage(graphicAssets.textures.image, 313, 94, 120, 110, 240, 194, 120, 110);
        ctx.drawImage(graphicAssets.textures.image, 313, 94, 120, 110, 360, 194, 120, 110);
        ctx.drawImage(graphicAssets.textures.image, 313, 94, 120, 110, 480, 194, 120, 110);
        ctx.imageSmoothingEnabled = true;
        ctx.restore();

        // camera post-draw
        this.camera.PostDraw();

        // player debug data
        this.player.DrawDebug(ctx);

        // player points
        ctx.fillStyle = "white";
        ctx.font = "40px Comic Sans MS";
        ctx.fillText(this.player.score, canvas.width / 2 - 5, 50);

        // camera debug text
        ctx.fillStyle = "white";
        ctx.font = "14px Comic Sans MS";
        ctx.fillText("Camera: x=" + this.camera.position.x.toFixed(2) + ", y=" + this.camera.position.y.toFixed(2), 10, 42);
    }
}
