import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  Points,
  PointsMaterial,
  Vector3,
} from "three";

function* generateRandomPoints(n)
{
  for (let i = 0; i < n; i += 1)
  {
    const radius = Math.random() * 25 + 25;
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

function createStars(numStars, texture = null)
{
  const verts = [];
  const colors = [];

  for (const pos of generateRandomPoints(numStars))
  {
    const col = new Color().setHSL(Math.random(), 0.2, Math.random());
    verts.push(pos.x, pos.y, pos.z);
    colors.push(col.r, col.g, col.b);
  }

  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(verts, 3));
  geo.setAttribute("color", new Float32BufferAttribute(colors, 3));
  const mat = new PointsMaterial({
    size: 0.1,
    alphaTest: 0.5,
    transparent: true,
    vertexColors: true,
    blending: AdditiveBlending,
    map: texture,
  });
  return new Points(geo, mat);
}

export default class extends Group
{
  constructor({numStars = 1000, texture = null} = {})
  {
    super();
    this.add(createStars(numStars, texture));
  }

  animate(t)
  {
    this.rotation.y += 0.00005;
  }
}


