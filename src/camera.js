
class Camera
{
    constructor(player)
    {
        this.player = player;
        
        this.offset = {x: 300, y: canvas.height - 240};
        this.position = {x: 0, y: 0};
        this.targetPosition = {x: 0, y: 0};

        this.rotation = 0;
        this.rotationPivot = {
            x: canvas.width / 2,
            y: canvas.height / 2
        },

        this.minX = 0;
        this.maxX = 800;
        this.minY = 0;

        this.smothingSpeed = 2;

        this.shakingTime = 0;
        this.shakeIntensity = 5;
        this.shakeAperture = 2;
        this.timeSinceShake = 0;

        //this.Shake(10000, this.shakeIntensity, this.shakeAperture);
    }

    Update(deltaTime)
    {
        this.targetPosition.x = this.player.position.x - this.offset.x;
        this.targetPosition.y = (this.player.position.y - this.offset.y) * 0.2;

        // minX-maxX clamp
        this.targetPosition.x = Math.min(Math.max(this.targetPosition.x, this.minX), this.maxX);

        // smoth repositioning
        const smothStep = this.smothingSpeed * deltaTime;
        this.position.x += (this.targetPosition.x - this.position.x) * smothStep;
        this.position.y += (this.targetPosition.y - this.position.y) * smothStep;

        // camera shake
        if (this.shakingTime > 0.0)
        {
            this.timeSinceShake += deltaTime;
            
            this.position.x += Math.cos(this.timeSinceShake * this.shakeIntensity * randomBetween(-1, 1)) * this.shakeAperture * randomBetween(-1, 1);
            this.position.y += Math.sin(this.timeSinceShake * this.shakeIntensity * randomBetween(-1, 1)) * this.shakeAperture * randomBetween(-1, 1);

            this.shakingTime -= deltaTime;
        }
        this.rotation += 0.01;
    }

    PreDraw()
    {
        /*this.rotationPivot.x = this.player.position.x;
        this.rotationPivot.y = this.player.position.y;// + (this.player.height * scale);
        ctx.save();
        ctx.rotate(this.rotation);
        ctx.translate(-this.rotationPivot.x, -this.rotationPivot.y);*/
        //ctx.translate(-this.rotationPivot.x, -this.rotationPivot.y);


        ctx.save();
        ctx.translate(-this.position.x, -this.position.y);
    }

    PostDraw()
    {
        ctx.restore();
    }

    Shake(time, intensity, aperture)
    {
        this.timeSinceShake = 0;
        this.shakingTime = time;
        this.shakeIntensity = intensity;
        this.shakeAperture = aperture;
    }
}
