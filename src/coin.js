class Coin
{
    constructor(position)
    {
        this.type = "coin";

        this.points = 1;

        this.position = position;
        this.scale = 0.5;
        this.animation = null;

        // physics properties of the coins body
        this.physicsOptions = {
            user_data: this,
            type: b2Body.b2_kinematicBody,
            isSensor: true
        };

        this.body = null;

        this.toDelete = false;
    }

    Start()
    {
        this.animation = new SSAnimation(graphicAssets.coin.image, 100, 100, [10], 1/24);

        this.body = CreateBox(world, this.position.x / scale, (canvas.height - this.position.y) / scale, 0.2, 0.22, this.physicsOptions);
    }

    Update(deltaTime)
    {
        this.animation.Update(deltaTime);
    }

    Draw(ctx)
    {
        ctx.save();
        
        ctx.translate(this.position.x, this.position.y);
        ctx.scale(this.scale, this.scale);

        this.animation.Draw(ctx);
        
        ctx.restore();
    }
}