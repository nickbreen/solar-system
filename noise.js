import {ImprovedNoise} from "three/addons/math/ImprovedNoise.js";
import {SimplexNoise} from "three/addons/math/SimplexNoise.js";

const canvas = document.createElement('canvas');

export default canvas

canvas.width = canvas.height = 1024;
const ctx = canvas.getContext('2d')
const imgData = ctx.createImageData(canvas.width, canvas.height)
const noise = new SimplexNoise
for (let y = 0; y < canvas.height; y++)
{
  for (let x = 0; x < canvas.width; x++)
  {
    const i = (y * canvas.width + x) * 4
    const n = noise.noise(x, y)/5 + 0.8
    imgData.data[i + 0] = n * 0xff
    imgData.data[i + 1] = n * 0xff
    imgData.data[i + 2] = n * 0x99;
    imgData.data[i + 3] = 0xff
  }
}
ctx.putImageData(imgData, 0, 0);
export const uri = canvas.toDataURL('image/png');
