
var animState = {
    IDLE : "idle",
    MOVE : "move",
    ATTACK : "attack",
    TO_JUMP : "to_jump",
    JUMP : "jump",
    ON_GUARD: "on_guard",
    DIE : "die"
}

var animName = {
    attack_A: 0,
    attack_B: 1,
    attack_C: 2,
    die: 3,
    fall_loop: 4,
    get_hit: 5,
    guard: 6,
    guard_end: 7,
    guard_start: 8,
    idle: 9,
    jump_start: 10,
    jump_loop: 11,
    run: 12
}

class Player
{
    constructor()
    {
        this.type = 'player';

        this.position = {x: 200, y: 200};
        this.width = 0.4,
        this.height = 0.5;
        
        this.scale = 3;

        this.onFloor = false;

        this.isGoingLeft = false;

        this.dying = false;

        // movement attr
        this.maxHorizontalVel = 3;
        this.maxVerticalVel = 10;
        this.jumpForce = 1000;

        // movement flags
        this.moveLeft = false;
        this.moveRight = false;
        this.moveUp = false;

        this.moving = false;  // "during this frame the player has moved"
        this.jumping = false; // "during this frame the player has jumped"
        this.attacking = false; // "during this frame the player has attacked"
        this.onWard = false;

        this.timeToCancelAttack = 0.33; // time after each attack can be canceled to put on ward
        this.timeToCancelAttackCounter = 0.0;

        this.secondAttackTriggered = false;
        this.timeWindowToTriggerSecondAttack = [0.5, 0.8],

        this.thirdAttackTriggered = false;
        this.timeWindowToTriggerThirdAttack = [1.5, 1.8],
        
        this.auxAttackCounter = 0.0;

        this.currentAttackId = -1; // -1=no_attack, 0=attack1, 1=attack2, 2=attack3

        // atacks lengths
        this.attackLengths = [];

        this.canJump = false;

        this.score = 0;

        // reference to the Animation object
        this.animation = null;

        // physics properties of the players body
        this.physicsOptions = {
            density: 1,
            fixedRotation: true,
            linearDamping: 1,
            user_data: this,
            type: b2Body.b2_dynamicBody,
            restitution: 0.0,
            friction: 0.5
        };

        // reference to the players body
        this.body = null;

        // player animation state machine
        this.animState = animState.IDLE;
        this.animLastState = animState.IDLE;

        // block effect animation
        this.blockEffectAnimation = null;
        this.blockEffectPosition = {x: 0, y: 0};
        this.blockEffectActive = false;
    }

    Start()
    {
        const frameDuration = 1/15;
        this.animation = new SSAnimation(
            graphicAssets.knight.image,
            79, // frameWidth
            63, // frameHeight
            [14, 13, 14, 10, 2, 5, 6, 4, 4, 6, 4, 2, 8], // frameCount
            frameDuration
        );

        this.body = CreateBox(world,
            this.position.x / scale, this.position.y / scale,
            this.width, this.height, this.physicsOptions);

        this.body.SetUserData(this);

        // compute the attacks lenghts based on its animations
        this.attackLengths.push(this.animation.frameCount[animName.attack_A] * frameDuration);
        this.attackLengths.push(this.animation.frameCount[animName.attack_B] * frameDuration);
        this.attackLengths.push(this.animation.frameCount[animName.attack_C] * frameDuration);

        this.animState = animState.IDLE;
        // play the idle animation looped
        this.animation.PlayAnimationLoop(animName.idle);

        this.blockEffectAnimation = new SSAnimation(
            graphicAssets.block_effect.image,
            64, // frameWidth
            64, // frameHeight
            [16, 16, 16], // frameCount
            frameDuration
        );
    }

    Update(deltaTime)
    {
        // force death
        if (Input.IsKeyPressed(KEY_F) && !this.dying)
            this.Die();

        // clear movement flag
        this.moving = false;

        // update counters
        this.auxAttackCounter += deltaTime;
        this.timeToCancelAttackCounter += deltaTime;

        // on guard
        if (Input.IsKeyPressed(KEY_LCTRL) && !this.jumping)
        {
            if (!this.attacking || (this.attacking && this.timeToCancelAttackCounter < this.timeToCancelAttack))
            {
                if (this.attacking)
                {
                    // cancel the attack
                    this.attacking = this.secondAttackTriggered = this.thirdAttackTriggered = false;
                }

                if (!this.onWard)
                {
                    // first launch of the guard, play the animation
                    // copy the past state
                    this.animLastState = this.animState;
                    // update the state
                    this.animState = animState.ON_GUARD;

                    this.onWard = true;

                    this.animation.PlayAnimation(animName.guard_start);
                }
                
            }
        }
        else if (this.onWard)
        {
            // release the guard
            // copy the past state
            this.animLastState = this.animState;
            // update the state
            this.animState = animState.IDLE;
            
            this.onWard = false;

            this.animation.PlayAnimation(animName.guard_end);
        }

        /*if ((Input.IsKeyPressed(KEY_LEFT) || Input.IsKeyPressed(KEY_A)) &&
            this.animState !== animState.JUMP && this.animState !== animState.TO_JUMP)
            this.moveLeft = true;

        if ((Input.IsKeyPressed(KEY_RIGHT) || Input.IsKeyPressed(KEY_D)) &&
            this.animState !== animState.JUMP && this.animState !== animState.TO_JUMP)
            this.moveRight = true;*/

        if (Input.IsKeyPressed(KEY_LEFT) || Input.IsKeyPressed(KEY_A))
            this.moveLeft = true;

        if (Input.IsKeyPressed(KEY_RIGHT) || Input.IsKeyPressed(KEY_D))
            this.moveRight = true;

        this.moving = this.moveLeft || this.moveRight;

        if (Input.IsKeyPressed(KEY_UP) || Input.IsKeyPressed(KEY_W) || Input.IsKeyPressed(KEY_SPACE) &&
        this.animState !== animState.JUMP && this.animState !== animState.TO_JUMP &&
        !this.dying)
        {
            // want to begin jump during this frame
            this.Jump();
        }

        // attack
        if (Input.IsMousePressed() && !this.jumping && !this.dying)
        {
            // play some audio fx
            //audioAssets.laser.audio.play();

            // camera shake
            scene1.camera.Shake(0.9, 5, 2);

            if (this.attacking)
            {
                if (this.secondAttackTriggered && !this.thirdAttackTriggered &&
                    this.auxAttackCounter >= this.timeWindowToTriggerThirdAttack[0] &&
                    this.auxAttackCounter <= this.timeWindowToTriggerThirdAttack[1])
                {
                    // third attack on a row
                    this.thirdAttackTriggered = true;

                    // reset the counter
                    this.auxAttackCounter = 0.0;

                    // TODO attack code, make damage & stuff
                }
                else if (!this.secondAttackTriggered &&
                    this.auxAttackCounter >= this.timeWindowToTriggerSecondAttack[0] &&
                    this.auxAttackCounter <= this.timeWindowToTriggerSecondAttack[1])
                {
                    // second attack on a row
                    this.secondAttackTriggered = true;

                    // TODO attack code, make damage & stuff
                }
            }
            else if (!this.secondAttackTriggered && !this.thirdAttackTriggered)
            {
                // first attack

                // reset the attack counter
                this.auxAttackCounter = 0.0;
                this.timeToCancelAttackCounter = 0.0;

                // TODO attack code, make damage & stuff
                this.attacking = true;

                this.currentAttackId = 0;

                // copy the past state
                this.animLastState = this.animState;
                // update the state
                this.animState = animState.ATTACK;

                this.animation.PlayAnimation(animName.attack_A);
            }
        }

        // movement
        if (this.moveRight && !this.dying && !this.onWard)
        {
            // move animation (only if idle animation running)
            if (this.animState === animState.IDLE)
            {
                // copy the past state
                this.animLastState = this.animState;
                this.animState = animState.MOVE;

                this.animation.PlayAnimationLoop(animName.run);
            }

            this.ApplyVelocity(new b2Vec2(1, 0));
            this.moveRight = false;
            this.isGoingLeft = false;
        }

        if (this.moveLeft && !this.dying && !this.onWard)
        {
            // move animation (only if idle animation running)
            if (this.animState === animState.IDLE)
            {
                // copy the past state
                this.animLastState = this.animState;
                this.animState = animState.MOVE;

                this.animation.PlayAnimationLoop(animName.run);
            }

            this.ApplyVelocity(new b2Vec2(-1, 0));
            this.moveLeft = false;
            this.isGoingLeft = true;
        }

        // jump
        if (this.moveUp && !this.dying && !this.onWard)
        {
            // if attacking -> cancel the attack
            this.attacking = false;
            this.secondAttackTriggered = false;
            this.thirdAttackTriggered = false;

            // copy the past state
            this.animLastState = this.animState;
            // begining of the jump
            this.animState = animState.TO_JUMP;

            // prepare jump animation
            this.animation.PlayAnimation(animName.jump_start);

            this.jumping = true;
            this.moveUp = false;
        }

        // return to idle (if !moving && !jumping && !attacking && !dying && !onWard)
        if (!this.jumping && !this.moving && !this.attacking && !this.dying && !this.onWard &&
            this.animState !== animState.IDLE)
        {
            // copy the past state
            this.animLastState = this.animState;
            // new state: idle
            this.animState = animState.IDLE;

            // play the idle animation
            this.animation.PlayAnimationLoop(animName.idle);
        }

        // update the position
        let bodyPosition = this.body.GetPosition();
        this.position.x = bodyPosition.x * scale;
        this.position.y = Math.abs((bodyPosition.y * scale) - ctx.canvas.height);

        // animation controller
        switch (this.animState)
        {
            case animState.IDLE:
                // if playing the guard off animation wait for the animation to end and play the idle loop
                if (this.animation.actualAnimation == 7 && this.animation.ended)
                    this.animation.PlayAnimationLoop(animName.idle);
                break;

            case animState.MOVE:
                break;

            case animState.TO_JUMP:
                // wait for the "preparation to jump" animation to end
                if (this.animation.ended)
                {
                    // do the jump
                    this.ApplyVelocity(new b2Vec2(0, this.jumpForce));
                    this.onFloor = false;
                    this.moveUp = false;

                    this.animState = animState.JUMP;
                    this.animation.PlayAnimationLoop(animName.jump_loop);
                }
                break;

            case animState.JUMP:
                // wait for the player to return to the ground (OnFloor method)
                // if the player has began to fall (not going up any more) change the loop animation
                if (this.animation.actualAnimation == 11 && this.body.GetLinearVelocity().y < 0.0)
                    this.animation.PlayAnimationLoop(animName.fall_loop);
                break;

            case animState.ATTACK:
                // wait for the attack animation to end
                // the attacks animation have two final frames to be a transition
                // to the idle animation, to chain attacks these frames should be skiped
                if (this.currentAttackId == 0)
                {
                    // first attack
                    if (!this.secondAttackTriggered && !this.thirdAttackTriggered)
                    {
                        // simple attack, return to idle when the animation ends
                        if (this.animation.ended)
                        {
                            // atack has ended
                            this.AnimReturnToIdleFromAttack();
                        }
                    }
                    else if (this.secondAttackTriggered)
                    {
                        // check for the frame to chain the second attack
                        if (this.animation.actualFrame == 11 &&
                            this.animation.actualFrameCountTime + deltaTime > this.animation.framesDuration)
                        {
                            // launch the second attack
                            this.currentAttackId = 1;

                            this.timeToCancelAttackCounter = 0.0;
                            
                            // TODO attack code

                            // play the second attack animation
                            this.animation.PlayAnimation(animName.attack_B);
                        }
                    }
                }
                else if (this.currentAttackId == 1)
                {
                    // second attack
                    if (!this.thirdAttackTriggered)
                    {
                        if (this.animation.ended)
                        {
                            // atack has ended
                            this.AnimReturnToIdleFromAttack();
                        }
                    }
                    else
                    {
                        // check for the frame to chain the third attack
                        if (this.animation.actualFrame == 10 &&
                            this.animation.actualFrameCountTime + deltaTime > this.animation.framesDuration)
                        {
                            // launch the third attack
                            this.currentAttackId = 2;

                            this.timeToCancelAttackCounter = 0.0;

                            // TODO attack code

                            // play the third attack animation
                            this.animation.PlayAnimation(animName.attack_C);
                        }
                    }
                }
                else if (this.currentAttackId == 2)
                {
                    // third attack
                    if (this.animation.ended)
                    {
                        // atack has ended
                        this.AnimReturnToIdleFromAttack();
                    }
                }

                /*if (this.animation.ended)
                {
                    if (this.currentAttackId == 1 && this.thirdAttackTriggered)
                    {
                        // launch the third attack
                        this.currentAttackId = 2;
                        // TODO attack code

                        // play the third attack animation
                        this.animation.PlayAnimation(animName.attack_C);
                    }
                    else if (this.currentAttackId == 0 && this.secondAttackTriggered)
                    {
                        // launch the second attack
                        this.currentAttackId = 1;
                        // TODO attack code

                        // play the second attack animation
                        this.animation.PlayAnimation(animName.attack_B);
                    }
                    else
                    {
                        // atack has ended
                        this.attacking = false;
                        this.secondAttackTriggered = this.thirdAttackTriggered = false;
                        this.currentAttackId = -1;

                        this.animState = animState.IDLE;
                        this.animLastState = animState.ATTACK;

                        // play the idle animation
                        this.animation.PlayAnimationLoop(animName.idle);
                    }                    
                }*/
                break;

            case animState.ON_GUARD:
                // check for the animation step, if playing 8 (guard_start), look for the final frame to launch the guard idle 6
                if (this.animation.actualAnimation == animName.guard_start &&
                    this.animation.actualFrame == 3 &&
                    this.animation.actualFrameCountTime + deltaTime > this.animation.framesDuration)
                {
                    this.animation.PlayAnimationLoop(animName.guard);

                    // play the block effect animation
                    this.blockEffectAnimation.PlayAnimation(RandomBetweenInts(0, 2));
                    if (this.isGoingLeft)
                        this.blockEffectPosition.x = this.position.x - 20 * this.scale;
                    else
                        this.blockEffectPosition.x = this.position.x + 20 * this.scale;
                    this.blockEffectPosition.y = this.position.y - 2 * this.scale;
                    this.blockEffectActive = true;
                }
                break;
        }
        
        // update the animation
        this.animation.Update(deltaTime);

        // update the block effect animation
        if (this.blockEffectActive)
        {
            this.blockEffectAnimation.Update(deltaTime);
            if (this.blockEffectAnimation.ended)
                this.blockEffectActive = false;
        }
    }

    Draw(ctx)
    {
        ctx.imageSmoothingEnabled = false;

        ctx.save();

        ctx.translate(this.position.x + 30, this.position.y - 44);

        // debug data
        ctx.font = "14px Comic Sans MS";
        ctx.fillStyle = "yellow";
        ctx.fillText(this.animState, 0, -50);

        if (this.secondAttackTriggered)
            ctx.fillText("second attack triggered!", 0, -35);

        if (this.thirdAttackTriggered)
            ctx.fillText("third attack triggered!!!!!", 0, -20);

        ctx.scale(this.scale, this.scale);

        if (this.isGoingLeft)
        {
            ctx.translate(-20, 0);
            ctx.scale(-1, 1);
        }

        this.animation.Draw(ctx);

        ctx.restore();

        // block effect animation
        if (this.blockEffectActive)
        {
            ctx.save();
            ctx.translate(this.blockEffectPosition.x, this.blockEffectPosition.y);
            ctx.scale(this.scale, this.scale);
                this.blockEffectAnimation.Draw(ctx);
            ctx.restore();
        }
        
        ctx.imageSmoothingEnabled = true;
    }

    DrawDebug(ctx)
    {
        ctx.save();
        ctx.translate(10, 80);

        ctx.font = "14px Comic Sans MS";
        ctx.fillStyle = "gray";
        ctx.strokeStyle = "white";

        /*this.moving = false;  // "during this frame the player has moved"
        this.jumping = false; // "during this frame the player has jumped"
        this.attacking = false; // "during this frame the player has attacked"
        this.onWard = false;*/

        
        ctx.fillText("moving", 0, 12);
        ctx.fillText("jumping", 75, 12);
        ctx.fillText("attacking", 150, 12);
        ctx.fillText("onWard", 225, 12);

        ctx.fillText("Attack 0", 0, 32);
        ctx.fillText("Attack 1", 0, 52);
        ctx.fillText("Attack 2", 0, 72);

        if (this.moving)
        {
            ctx.fillStyle = "yellow";
            ctx.fillText("moving", 0, 12);
        }

        if (this.jumping)
        {
            ctx.fillStyle = "yellow";
            ctx.fillText("jumping", 75, 12);
        }

        if (this.onWard)
        {
            ctx.fillStyle = "yellow";
            ctx.fillText("onWard", 225, 12);
        }

        if (this.attacking)
        {
            ctx.fillStyle = "yellow";
            ctx.fillText("attacking", 150, 12);

            // attack 0 data
            if (this.currentAttackId == 0)
            {
                ctx.fillStyle = "yellow";
                ctx.fillText("Attack 0", 0, 32);

                ctx.fillStyle = "darkred";

                if (this.auxAttackCounter >= this.timeWindowToTriggerSecondAttack[0] && this.auxAttackCounter <= this.timeWindowToTriggerSecondAttack[1])
                    ctx.fillStyle = "orange";

                ctx.fillRect(80, 20,
                    ((this.animation.actualFrame * this.animation.framesDuration) + this.animation.actualFrameCountTime) * 100/ this.attackLengths[0],
                    14)
            }
            else if (this.currentAttackId == 1)
            {
                ctx.fillStyle = "yellow";
                ctx.fillText("Attack 1", 0, 52);

                ctx.fillStyle = "darkred";

                if (this.auxAttackCounter >= this.timeWindowToTriggerThirdAttack[0] && this.auxAttackCounter <= this.timeWindowToTriggerThirdAttack[1])
                    ctx.fillStyle = "orange";

                ctx.fillRect(80, 40,
                    ((this.animation.actualFrame * this.animation.framesDuration) + this.animation.actualFrameCountTime) * 100 / this.attackLengths[1],
                    14)
            }
            else if (this.currentAttackId == 2)
            {
                ctx.fillStyle = "yellow";
                ctx.fillText("Attack 2", 0, 72);

                ctx.fillStyle = "darkred";

                ctx.fillRect(80, 60,
                    ((this.animation.actualFrame * this.animation.framesDuration) + this.animation.actualFrameCountTime) * 100 / this.attackLengths[2],
                    14)
            }
        }
        ctx.fillStyle = "white";
        ctx.strokeRect(80, 20, 100, 14);
        ctx.strokeRect(80, 40, 100, 14);
        ctx.strokeRect(80, 60, 100, 14);

        ctx.restore();
    }

    ApplyVelocity(vel)
    {
        let bodyVel = this.body.GetLinearVelocity();
        bodyVel.Add(vel);

        // horizontal movement cap
        if (Math.abs(bodyVel.x) > this.maxHorizontalVel)
            bodyVel.x = this.maxHorizontalVel * bodyVel.x / Math.abs(bodyVel.x);

        // vertical movement cap
        if (Math.abs(bodyVel.y) > this.maxVerticalVel)
            bodyVel.y = this.maxVerticalVel * bodyVel.y / Math.abs(bodyVel.y);

        this.body.SetLinearVelocity(bodyVel);
    }

    Jump()
    {
        if (Math.abs(this.body.GetLinearVelocity().y) > 0.1 || !this.canJump)
            return false;

        this.moveUp = true;
        this.canJump = false;
    }

    OnFloor()
    {
        const playerLinearVelocity = this.body.GetLinearVelocity();
        
        this.body.SetLinearVelocity(new b2Vec2(playerLinearVelocity.x, 0));

        this.canJump = true;
        this.onFloor = true;

        this.jumping = false;

        this.animLastState = this.animState;
        this.animState = animState.IDLE;

        // play the idle animation
        this.animation.PlayAnimationLoop(animName.idle);
    }

    AnimReturnToIdleFromAttack()
    {
        this.attacking = false;
        this.secondAttackTriggered = this.thirdAttackTriggered = false;
        this.currentAttackId = -1;

        this.animState = animState.IDLE;
        this.animLastState = animState.ATTACK;

        // play the idle animation
        this.animation.PlayAnimationLoop(animName.idle);
    }

    Die()
    {
        this.attacking = false;
        this.secondAttackTriggered = this.thirdAttackTriggered = false;
        this.currentAttackId = -1;

        this.animLastState = this.animState;
        this.animState = animState.DIE;

        this.dying = true;

        // play the dying animation
        this.animation.PlayAnimation(animName.die);
    }

}
