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

const vertexShaderBasic = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`

const fragmentShaderBasic = `
varying vec2 vUv;
void main() {
  // colour is RGBA: u, v, 0, 1
  gl_FragColor = vec4( vec3( vUv, 0. ), 1. );
}
`

// https://github.com/ashima/webgl-noise/blob/master/src/classicnoise3D.glsl
const classicNoise3D = `
//
// GLSL textureless classic 3D noise "cnoise",
// with an RSL-style periodic variant "pnoise".
// Author:  Stefan Gustavson (stefan.gustavson@liu.se)
// Version: 2011-10-11
//
// Many thanks to Ian McEwan of Ashima Arts for the
// ideas for permutation and gradient selection.
//
// Copyright (c) 2011 Stefan Gustavson. All rights reserved.
// Distributed under the MIT license. See LICENSE file.
// https://github.com/stegu/webgl-noise
//

vec3 mod289(vec3 x)
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x)
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x)
{
  return mod289(((x*34.0)+10.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

vec3 fade(vec3 t) {
  return t*t*t*(t*(t*6.0-15.0)+10.0);
}

// Classic Perlin noise
float cnoise(vec3 P)
{
  vec3 Pi0 = floor(P); // Integer part for indexing
  vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
}

// Classic Perlin noise, periodic variant
float pnoise(vec3 P, vec3 rep)
{
  vec3 Pi0 = mod(floor(P), rep); // Integer part, modulo period
  vec3 Pi1 = mod(Pi0 + vec3(1.0), rep); // Integer part + 1, mod period
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
}
`

const turbulence = `
float turbulence( vec3 p )
{
  float w = 100.0;
  float t = -.5;
  for (float f = 1.0 ; f <= 10.0 ; f++ ){
    float power = pow( 2.0, f );
    t += abs( pnoise( vec3( power * p ), vec3( 10.0, 10.0, 10.0 ) ) / power );
  }
  return t;
}
`

const vertexShaderNoise = `
${classicNoise3D}
${turbulence}
varying vec2 vUv;
varying float noise;
void main()
{
  vUv = uv;
  // get a turbulent 3d noise using the normal, normal to high freq
  noise = turbulence( .5 * normal );
  // get a 3d noise using the position, low frequency
  float b = pnoise( 0.05 * position, vec3( 10.0 ) );
  // compose both noises
  float displacement = - 1. * (noise + b);
  // move the position along the normal and transform it
  vec3 newPosition = position + normal * displacement;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
}
`

const fragmentShaderNoise = `
varying vec2 vUv;
varying float noise;
void main() {
  vec3 color = vec3( vUv * ( 1. - 2. * noise ), 0.0 );
  gl_FragColor = vec4( vec3( vUv, 0. ), 1. );
}
`

class Photosphere extends Mesh
{
  constructor(texture)
  {
    const geometry = new IcosahedronGeometry(5, 12);
    const material = new MeshBasicMaterial({
      map: texture,
      // aoMap: texture,
      color: 0xffff99,
      // transparent: false
      // emissive: new Color(0xffff99),
      // emissiveIntensity: 1.5,
    });
    const materialNoise = new ShaderMaterial({
      vertexShader: vertexShaderNoise,
      fragmentShader: fragmentShaderNoise,
      map: texture
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
  constructor(texture, {position = new Vector3()} = {})
  {
    super();
    this.position.copy(position);
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
