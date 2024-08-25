import {
  AdditiveBlending,
  BackSide,
  Color,
  DynamicDrawUsage,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  PointLight,
  ShaderMaterial,
  Vector3,
} from "three";
import {ImprovedNoise} from "three/addons/math/ImprovedNoise.js";

const vertexShaderCorona = `
uniform float fresnelBias;
uniform float fresnelScale;
uniform float fresnelPower;

varying float vReflectionFactor;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
  vec4 worldPosition = modelMatrix * vec4( position, 1.0 );

  vec3 worldNormal = normalize( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal );

  vec3 I = worldPosition.xyz - cameraPosition;

  vReflectionFactor = fresnelBias + fresnelScale * pow( 1.0 + dot( normalize( I ), worldNormal ), fresnelPower );

  gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShaderCorona = `
uniform vec3 color1;
uniform vec3 color2;

varying float vReflectionFactor;

void main() {
  float f = clamp( vReflectionFactor, 0.0, 1.0 );
  gl_FragColor = vec4(mix(color2, color1, vec3(f)), f);
}
`;

class Photosphere extends Mesh
{
  constructor(texture)
  {
    const geometry = new IcosahedronGeometry(5, 12);
    const material = new MeshBasicMaterial({
      map: texture,
      // color: 0xffff99,
      // emissive: new Color(0xffff99),
      // emissiveIntensity: 1.5,
    });
    super(geometry, material);
  }

  animate(t)
  {
    this.rotation.y = -t / 5;
  }
}

class NoisyMesh extends Mesh
{
  constructor(geometry, material, noise)
  {
    super(geometry, material);
    this.noise = noise;
  }

  animate(t)
  {
    const v3 = new Vector3();
    const p = new Vector3();
    const pos = this.geometry.attributes.position;
    pos.usage = DynamicDrawUsage;
    for (let i = 0; i < pos.count; i += 1)
    {
      p.fromBufferAttribute(pos, i).normalize();
      v3.copy(p).multiplyScalar(5);
      let ns = this.noise.noise(
        v3.x + Math.cos(t),
        v3.y + Math.sin(t),
        v3.z + t
      );
      v3.copy(p)
        .setLength(5)
        .addScaledVector(p, ns * 0.4);
      pos.setXYZ(i, v3.x, v3.y, v3.z);
    }
    pos.needsUpdate = true;
  }
}

class Chromosphere extends NoisyMesh
{
  constructor(noise, {scale = 1, color, rotation = 0} = {})
  {
    const geometry = new IcosahedronGeometry(5, 12);
    const material = new MeshBasicMaterial({
      color,
      side: BackSide,
      });
    super(geometry, material, noise);
    this.scale.setScalar(scale)
    this.rotation.y = rotation
  }
}

class Corona extends NoisyMesh
{
  constructor(noise, vertexShader, fragmentShader, {scale = 1.1, color = 0xff0000, rotation = 0} = {})
  {
    const uniforms = {
      color1: {value: new Color(0x000000)},
      color2: {value: new Color(color)},
      fresnelBias: {value: 0.2},
      fresnelScale: {value: 1.5},
      fresnelPower: {value: 4.0},
    };

    const material = new ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      blending: AdditiveBlending,
    });
    const geometry = new IcosahedronGeometry(5, 12);
    super(geometry, material, noise);
    this.scale.setScalar(scale);
    this.rotation.y = rotation;
  }
}

export default class Sun extends Group
{
  constructor(texture)
  {
    super();
    const noise = new ImprovedNoise();
    this
      .add(new Photosphere(texture))
      .add(new Chromosphere(noise, {color: 0xffc000, rotation: Math.random()}))
      .add(new Chromosphere(noise, {color: 0xff8000, rotation: Math.random()}))
      .add(new Chromosphere(noise, {color: 0xff4000, rotation: Math.random()}))
      .add(new Corona(noise, vertexShaderCorona, fragmentShaderCorona, {scale: 1.1, color: 0xff0000, rotation: Math.random()}))
      .add(new Corona(noise, vertexShaderCorona, fragmentShaderCorona, {scale: 1.075, color: 0xffc000, rotation: Math.random()}))
      .add(new Corona(noise, vertexShaderCorona, fragmentShaderCorona, {scale: 1.05, color: 0xff8000, rotation: Math.random()}))
      .add(new PointLight(0xffff99, 1000));
    this.userData.isAnimate = true
  }

  animate(t)
  {
    this.children.filter(child => child.animate).forEach(child => child.animate(t * 0.0002))
  }
}
