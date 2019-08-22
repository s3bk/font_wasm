importScripts("pkg/font_wasm.js");

let queue = [];
self.onmessage = function(e) {
    queue.push(e);
};

async function init() {
    let r = await fetch("pkg/font_wasm_bg.wasm");
    let data = await r.arrayBuffer();
    let module = await wasm_bindgen(data);
    let ctx = new Context();
    self.onmessage = function(m) {
        ctx.onmessage(m);
    };
    queue.forEach(e => ctx.onmessage(e));
    delete queue;
}
init();

function Context() {
    this.methods = {
        fonts: {},
        load_font: function(post, args) {
            let font = new wasm_bindgen.FontRef(new Uint8Array(args.data));
            this.fonts[args.font_id] = font;
        },
        draw_text: function(post, args) {
            let font = this.fonts[args.font_id];
            let image = font.draw_text(100, args.text);
            let width = image.width();
            let height = image.height();
            let array = new Uint8ClampedArray(4 * width * height);
            image.write_rgba_to(array);
            var img_data = new ImageData(array, width, height);
            createImageBitmap(img_data)
            .then(image_bitmap => post(image_bitmap, [image_bitmap]));
        }
    };
    this.onmessage = function(e) {
        let msg = e.data;
        console.log(msg);
        let id = msg.id;
        let fn = msg.method;
        let args = msg.args;
        let post = function(data, transfer) {
            self.postMessage({
                id: id,
                data: data
            }, transfer);
        }
        this.methods[fn](post, args);
    };
}
