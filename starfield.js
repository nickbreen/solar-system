import {AdditiveBlending, BufferGeometry, Color, Float32BufferAttribute, Points, PointsMaterial, Vector3,} from "three";

function* generateRandomPoints(n, d)
{
  for (let i = 0; i < n; i += 1)
  {
    const radius = Math.random() * d + d;
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    let x = radius * Math.sin(phi) * Math.cos(theta);
    let y = radius * Math.sin(phi) * Math.sin(theta);
    let z = radius * Math.cos(phi);

    yield new Vector3(x, y, z);
  }
}

export default class extends Points
{
  constructor({numStars = 1000, texture = null, distance = 25} = {})
  {
    const verts = [];
    const colors = [];

    for (const pos of generateRandomPoints(numStars, distance))
    {
      const col = new Color().setHSL(Math.random(), 0.2, Math.random());
      verts.push(pos.x, pos.y, pos.z);
      colors.push(col.r, col.g, col.b);
    }

    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute(verts, 3));
    geo.setAttribute("color", new Float32BufferAttribute(colors, 3));
    const mat = new PointsMaterial({
      size: 0.125,
      alphaTest: 0.5,
      transparent: true,
      vertexColors: true,
      blending: AdditiveBlending,
      map: texture,
    });

    super(geo, mat);
  }
}


