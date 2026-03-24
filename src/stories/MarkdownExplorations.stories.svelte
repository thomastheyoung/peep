<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import ExplorationWrapper from '$lib/explorations/ExplorationWrapper.svelte';

  import Exploration01 from '$lib/explorations/Exploration01_NeoBrutalist.svelte';
  import Exploration02 from '$lib/explorations/Exploration02_Glassmorphism.svelte';
  import Exploration03 from '$lib/explorations/Exploration03_RetroTerminal.svelte';
  import Exploration04 from '$lib/explorations/Exploration04_WarmPaper.svelte';
  import Exploration05 from '$lib/explorations/Exploration05_NeonCyberpunk.svelte';
  import Exploration06 from '$lib/explorations/Exploration06_PastelDream.svelte';
  import Exploration07 from '$lib/explorations/Exploration07_SwissDesign.svelte';
  import Exploration08 from '$lib/explorations/Exploration08_InkBrush.svelte';
  import Exploration09 from '$lib/explorations/Exploration09_CosmicPurple.svelte';
  import Exploration10 from '$lib/explorations/Exploration10_TropicalSunset.svelte';
  import Exploration11 from '$lib/explorations/Exploration11_ForestEarth.svelte';
  import Exploration12 from '$lib/explorations/Exploration12_ArtDeco.svelte';
  import Exploration13 from '$lib/explorations/Exploration13_CandyPop.svelte';
  import Exploration14 from '$lib/explorations/Exploration14_MinimalMono.svelte';
  import Exploration15 from '$lib/explorations/Exploration15_Newspaper.svelte';
  import Exploration16 from '$lib/explorations/Exploration16_Vaporwave.svelte';
  import Exploration17 from '$lib/explorations/Exploration17_ArcticIce.svelte';
  import Exploration18 from '$lib/explorations/Exploration18_SunsetDesert.svelte';
  import Exploration19 from '$lib/explorations/Exploration19_ElectricBlue.svelte';
  import Exploration20 from '$lib/explorations/Exploration20_Handwritten.svelte';

  const { Story } = defineMeta({
    title: 'Design Explorations/Markdown Themes',
    component: ExplorationWrapper,
    parameters: {
      layout: 'fullscreen',
    },
  });
</script>

<Story name="Neo Brutalist" exportName="NeoBrutalist">
  <Exploration01 />
</Story>

<Story name="Glassmorphism" exportName="Glassmorphism">
  <Exploration02 />
</Story>

<Story name="Retro Terminal" exportName="RetroTerminal">
  <Exploration03 />
</Story>

<Story name="Warm Paper" exportName="WarmPaper">
  <Exploration04 />
</Story>

<Story name="Neon Cyberpunk" exportName="NeonCyberpunk">
  <Exploration05 />
</Story>

<Story name="Pastel Dream" exportName="PastelDream">
  <Exploration06 />
</Story>

<Story name="Swiss Design" exportName="SwissDesign">
  <Exploration07 />
</Story>

<Story name="Ink and Brush" exportName="InkAndBrush">
  <Exploration08 />
</Story>

<Story name="Cosmic Purple" exportName="CosmicPurple">
  <Exploration09 />
</Story>

<Story name="Tropical Sunset" exportName="TropicalSunset">
  <Exploration10 />
</Story>

<Story name="Forest and Earth" exportName="ForestAndEarth">
  <Exploration11 />
</Story>

<Story name="Art Deco" exportName="ArtDeco">
  <Exploration12 />
</Story>

<Story name="Candy Pop" exportName="CandyPop">
  <Exploration13 />
</Story>

<Story name="Minimal Mono" exportName="MinimalMono">
  <Exploration14 />
</Story>

<Story name="Newspaper" exportName="Newspaper">
  <Exploration15 />
</Story>

<Story name="Vaporwave" exportName="Vaporwave">
  <Exploration16 />
</Story>

<Story name="Arctic Ice" exportName="ArcticIce">
  <Exploration17 />
</Story>

<Story name="Sunset Desert" exportName="SunsetDesert">
  <Exploration18 />
</Story>

<Story name="Electric Blue" exportName="ElectricBlue">
  <Exploration19 />
</Story>

<Story name="Handwritten" exportName="Handwritten">
  <Exploration20 />
</Story>
