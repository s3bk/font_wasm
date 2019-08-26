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
    this.fonts = {};
    this.styles = {};
    this.methods = {
        load_font: (post, args) => {
            let data = new Uint8Array(args.data);
            let t0 = performance.now();
            let font = new wasm_bindgen.FontRef(data);
            let t1 = performance.now();
            this.fonts[args.font_id] = font;
            post({time: t1 - t0});
        },
        draw_text: (post, args) => {
            let font = this.fonts[args.font_id];
            let style = this.styles[args.style_id]
            let t0 = performance.now();
            let image = font.draw_text(args.text, style);
            let t1 = performance.now();
            let width = image.width();
            let height = image.height();
            let array = new Uint8ClampedArray(4 * width * height);
            image.write_rgba_to(array);
            var img_data = new ImageData(array, width, height);
            createImageBitmap(img_data)
            .then(image_bitmap => post({
                image: image_bitmap,
                time: t1 - t0
            }, [image_bitmap]));
        },
        create_style: (post, args) => {
            let style = new wasm_bindgen.Style(args.json);
            this.styles[args.style_id] = style;
        },
    };
    this.onmessage = function(e) {
        let msg = e.data;
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
