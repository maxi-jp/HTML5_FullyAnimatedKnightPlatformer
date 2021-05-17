
var background = {

    // background gradient
    layer0: {
        position: {x: 0, y: 0},

        Draw: function (ctx, camera) {
            var bgGrd = ctx.createLinearGradient(0, 0, 0, canvas.height);
            bgGrd.addColorStop(0, "black");
            bgGrd.addColorStop(1, "#365B93");
            ctx.fillStyle = bgGrd;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    },

    // stars
    layer1: {
        position: {x: 0, y: 0},
        speed: 0.05,
        stars: [],

        Start: function () {
            // creamos un numero determinado de estrellas con posiciones y radio aleatorios
            let numberOfStars = 80;
            while (numberOfStars > 0)
            {
                let newStar = {
                    position: {
                        x: randomBetween(0, 900),
                        y: randomBetween(0, 340)
                    },
                    radius: randomBetween(0.5, 2.5)
                };
                this.stars.push(newStar);
                numberOfStars--;
            }
        },

        Draw: function (ctx, camera) {
            for (let i = 0; i < this.stars.length; i++)
            {
                ctx.fillStyle = "white";
                ctx.beginPath();
                ctx.arc(
                    this.stars[i].position.x - (camera.position.x * this.speed),
                    this.stars[i].position.y - (camera.position.y * this.speed),
                    this.stars[i].radius,
                    0,
                    PI2,
                    false
                );
                ctx.fill();
            }
        }
    },

    // mountain
    layer2: {
        position: {x: 0, y: -20},
        speed: 0.1,
        img: null,

        Start: function () {
            this.img = graphicAssets.mountain.image;
        },

        Draw: function (ctx, camera) {
            ctx.drawImage(
                this.img,
                this.position.x - (camera.position.x * this.speed),
                this.position.y + canvas.height - this.img.height - (camera.position.y * this.speed)
            );
        }
    },

    // trees
    layer3: {
        position: {x: 0, y: 0},
        h_speed: 0.8,
        v_speed: 0.85,
        img: null,

        tree0: {
            x: 0,
            y: 0,
            w: 193,
            h: 240,
            position: {x: 0, y: -4}
        },

        tree1: {
            x: 193,
            y: 0,
            w: 194,
            h: 240,
            position: {x: 300, y: 0}
        },

        Start: function () {
            this.img = graphicAssets.trees.image;
        },

        Draw: function (ctx, camera) {
            ctx.drawImage(
                this.img,
                this.tree0.x,
                this.tree0.y,
                this.tree0.w,
                this.tree0.h,
                - (camera.position.x * this.h_speed) + this.tree0.position.x,
                canvas.height - this.tree0.h - (camera.position.y * this.v_speed) + this.tree0.position.y,
                this.tree0.w,
                this.tree0.h,
            );

            ctx.drawImage(
                this.img,
                this.tree1.x,
                this.tree1.y,
                this.tree1.w,
                this.tree1.h,
                - (camera.position.x * this.h_speed) + this.tree1.position.x,
                canvas.height - this.tree1.h - (camera.position.y * this.v_speed) + this.tree1.position.y,
                this.tree1.w,
                this.tree1.h,
            );
        }
    },

    layers : null,

    // initializa the array of layers
    Start: function () {
        this.layers = new Array(this.layer0, this.layer1, this.layer2, this.layer3);
        for (let i = 0; i < this.layers.length; i++)
        {
            if (typeof(this.layers[i].Start) !== 'undefined')
                this.layers[i].Start();
        }
    },

    Draw: function (ctx, camera) {
        for (let i = 0; i < this.layers.length; i++)
            this.layers[i].Draw(ctx, camera);
    }

};
