import {
  AdditiveBlending,
  BackSide,
  Color,
  DynamicDrawUsage,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial, MeshStandardMaterial,
  PointLight,
  ShaderMaterial,
  Vector3,
} from "three";
import {ImprovedNoise} from "three/addons/math/ImprovedNoise.js";

const vertexShaderGlow = `
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

const fragmentShaderGlow = `
  uniform vec3 color1;
  uniform vec3 color2;

  varying float vReflectionFactor;

  void main() {
    float f = clamp( vReflectionFactor, 0.0, 1.0 );
    gl_FragColor = vec4(mix(color2, color1, vec3(f)), f);
  }
`;


const vertexShaderRim = `
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
const fragmentShaderRim = `
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
  constructor(geometry, material)
  {
    super(geometry, material);
    this.noise = new ImprovedNoise();
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

class Corona extends NoisyMesh
{
  constructor()
  {
    const geometry = new IcosahedronGeometry(4.9, 12);
    const material = new MeshBasicMaterial({
      color: 0xff4000,
      side: BackSide,
    });
    super(geometry, material);
  }
}

class Glow extends NoisyMesh
{
  constructor(vertexShader, fragmentShader)
  {
    const uniforms = {
      color1: {value: new Color(0x000000)},
      color2: {value: new Color(0xff0000)},
      fresnelBias: {value: 0.2},
      fresnelScale: {value: 1.5},
      fresnelPower: {value: 4.0},
    };

    const material = new ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: AdditiveBlending,
    });
    const geometry = new IcosahedronGeometry(5, 12);
    super(geometry, material);
    this.scale.setScalar(1.1)
  }
}

class Rim extends Mesh
{
  constructor(vertexShader, fragmentShader)
  {
    const uniforms = {
      color1: {value: new Color(0xffff99)},
      color2: {value: new Color(0x000000)},
      fresnelBias: {value: 0.2},
      fresnelScale: {value: 1.5},
      fresnelPower: {value: 4.0},
    };

    const material = new ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: AdditiveBlending,
    });
    const geometry = new IcosahedronGeometry(5, 12);
    super(geometry, material);
    this.scale.setScalar(1.01);
  }
}

class Lighting extends PointLight
{
  constructor()
  {
    super(0xffff99, 1000);
    this.position.set(0, 0, 0);
  }
}

export default class Sun extends Group
{
  constructor({texture = null} = {})
  {
    super();
    this.add(new Corona())
      // .add(new Rim(vertexShaderRim, fragmentShaderRim))
      .add(new Glow(vertexShaderGlow, fragmentShaderGlow))
      .add(new Lighting())
      .add(new Photosphere(texture));
    this.userData.isAnimate = true
  }

  animate(t)
  {
    this.children.filter(child => child.animate).forEach(child => child.animate(t * 0.00051))
  }
}
