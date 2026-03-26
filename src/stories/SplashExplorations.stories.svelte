<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import ExplorationWrapper from '$lib/explorations/ExplorationWrapper.svelte';

  import Splash01 from '$lib/explorations/splash/Splash01_Typewriter.svelte';
  import Splash02 from '$lib/explorations/splash/Splash02_RipplePulse.svelte';
  import Splash03 from '$lib/explorations/splash/Splash03_OrigamiUnfold.svelte';
  import Splash04 from '$lib/explorations/splash/Splash04_GradientWave.svelte';
  import Splash05 from '$lib/explorations/splash/Splash05_ParticleConverge.svelte';
  import Splash06 from '$lib/explorations/splash/Splash06_RetroTV.svelte';
  import Splash07 from '$lib/explorations/splash/Splash07_NeonSign.svelte';
  import Splash08 from '$lib/explorations/splash/Splash08_LiquidFill.svelte';
  import Splash09 from '$lib/explorations/splash/Splash09_Glitch.svelte';
  import Splash10 from '$lib/explorations/splash/Splash10_Sunrise.svelte';
  import Splash11 from '$lib/explorations/splash/Splash11_MatrixRain.svelte';
  import Splash12 from '$lib/explorations/splash/Splash12_BouncingLetters.svelte';
  import Splash13 from '$lib/explorations/splash/Splash13_MorphingBlob.svelte';
  import Splash14 from '$lib/explorations/splash/Splash14_StackedCards.svelte';
  import Splash15 from '$lib/explorations/splash/Splash15_GeometricKaleidoscope.svelte';
  import Splash16 from '$lib/explorations/splash/Splash16_SmokeReveal.svelte';
  import Splash17 from '$lib/explorations/splash/Splash17_DotGrid.svelte';
  import Splash18 from '$lib/explorations/splash/Splash18_AuroraBorealis.svelte';
  import Splash19 from '$lib/explorations/splash/Splash19_VinylRecord.svelte';
  import Splash20 from '$lib/explorations/splash/Splash20_PaperAirplane.svelte';
  import Splash21 from '$lib/explorations/splash/Splash21_AuroraHome.svelte';

  const { Story } = defineMeta({
    title: 'Design Explorations/Splash Screens',
    component: ExplorationWrapper,
    parameters: {
      layout: 'fullscreen',
    },
  });
</script>

<Story name="01 Typewriter" exportName="Typewriter">
  <Splash01 />
</Story>

<Story name="02 Ripple Pulse" exportName="RipplePulse">
  <Splash02 />
</Story>

<Story name="03 Origami Unfold" exportName="OrigamiUnfold">
  <Splash03 />
</Story>

<Story name="04 Gradient Wave" exportName="GradientWave">
  <Splash04 />
</Story>

<Story name="05 Particle Converge" exportName="ParticleConverge">
  <Splash05 />
</Story>

<Story name="06 Retro TV" exportName="RetroTV">
  <Splash06 />
</Story>

<Story name="07 Neon Sign" exportName="NeonSign">
  <Splash07 />
</Story>

<Story name="08 Liquid Fill" exportName="LiquidFill">
  <Splash08 />
</Story>

<Story name="09 Glitch" exportName="Glitch">
  <Splash09 />
</Story>

<Story name="10 Sunrise" exportName="Sunrise">
  <Splash10 />
</Story>

<Story name="11 Matrix Rain" exportName="MatrixRain">
  <Splash11 />
</Story>

<Story name="12 Bouncing Letters" exportName="BouncingLetters">
  <Splash12 />
</Story>

<Story name="13 Morphing Blob" exportName="MorphingBlob">
  <Splash13 />
</Story>

<Story name="14 Stacked Cards" exportName="StackedCards">
  <Splash14 />
</Story>

<Story name="15 Geometric Kaleidoscope" exportName="GeometricKaleidoscope">
  <Splash15 />
</Story>

<Story name="16 Smoke Reveal" exportName="SmokeReveal">
  <Splash16 />
</Story>

<Story name="17 Dot Grid" exportName="DotGrid">
  <Splash17 />
</Story>

<Story name="18 Aurora Borealis" exportName="AuroraBorealis">
  <Splash18 />
</Story>

<Story name="19 Vinyl Record" exportName="VinylRecord">
  <Splash19 />
</Story>

<Story name="20 Paper Airplane" exportName="PaperAirplane">
  <Splash20 />
</Story>

<Story name="21 Aurora Home" exportName="AuroraHome">
  <Splash21 />
</Story>
