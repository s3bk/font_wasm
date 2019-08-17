extern crate wasm_bindgen;
extern crate wee_alloc;

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

use wasm_bindgen::prelude::*;
use font::{Font, parse, draw_text};
use raqote::{DrawTarget, Path};

#[wasm_bindgen]
extern "C" {
    // Use `js_namespace` here to bind `console.log(..)` instead of just
    // `log(..)`
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}
macro_rules! console_log {
    // Note that this is using the `log` function imported above during
    // `bare_bones`
    ($($t:tt)*) => (log(&format!($($t)*)))
}

#[wasm_bindgen]
pub struct FontRef {
    raqote: Box<dyn Font<Path>>
}

#[wasm_bindgen]
impl FontRef {
    #[wasm_bindgen(constructor)]
    pub fn load(data: &[u8]) -> FontRef {
        FontRef {
            raqote: parse::<Path>(&data)
        }
    }
    
    pub fn draw_text(&self, font_size: f32, text: &str) -> Image {
        Image {
            data: draw_text::<DrawTarget>(&*self.raqote, font_size, text)
        }
    }
}

#[wasm_bindgen]
pub struct Image {
    data: DrawTarget
}

#[wasm_bindgen]
impl Image {
    pub fn width(&self) -> u32 {
        self.data.width() as _
    }
    pub fn height(&self) -> u32 {
        self.data.height() as _
    }
    pub fn get_data(&self, buffer: &mut [u8]) {
        let data = self.data.get_data();
        let data = unsafe { std::slice::from_raw_parts(data.as_ptr() as *const u8, data.len() * 4) };
        
        buffer.copy_from_slice(data);
    }
}
#[wasm_bindgen(start)]
pub fn main() {
    // executed automatically ...
}
