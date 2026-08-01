<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import ExplorationWrapper from '$lib/explorations/ExplorationWrapper.svelte';

  import TabExploration01 from '$lib/explorations/tabs/TabExploration01_PillTabs.svelte';
  import TabExploration02 from '$lib/explorations/tabs/TabExploration02_UnderlineGlow.svelte';
  import TabExploration03 from '$lib/explorations/tabs/TabExploration03_FloatingCards.svelte';
  import TabExploration04 from '$lib/explorations/tabs/TabExploration04_NeonOutline.svelte';
  import TabExploration05 from '$lib/explorations/tabs/TabExploration05_BubblePop.svelte';
  import TabExploration06 from '$lib/explorations/tabs/TabExploration06_FolderTabs.svelte';
  import TabExploration07 from '$lib/explorations/tabs/TabExploration07_SlashDiagonal.svelte';
  import TabExploration08 from '$lib/explorations/tabs/TabExploration08_DotIndicator.svelte';
  import TabExploration09 from '$lib/explorations/tabs/TabExploration09_TagLabel.svelte';
  import TabExploration10 from '$lib/explorations/tabs/TabExploration10_RibbonTabs.svelte';
  import TabExploration11 from '$lib/explorations/tabs/TabExploration11_TerminalTabs.svelte';
  import TabExploration12 from '$lib/explorations/tabs/TabExploration12_GlassTabs.svelte';
  import TabExploration13 from '$lib/explorations/tabs/TabExploration13_BrutalistTabs.svelte';
  import TabExploration14 from '$lib/explorations/tabs/TabExploration14_WaveTabs.svelte';
  import TabExploration15 from '$lib/explorations/tabs/TabExploration15_SegmentedControl.svelte';
  import TabExploration16 from '$lib/explorations/tabs/TabExploration16_GradientMesh.svelte';
  import TabExploration17 from '$lib/explorations/tabs/TabExploration17_ChipTabs.svelte';
  import TabExploration18 from '$lib/explorations/tabs/TabExploration18_StackedCards.svelte';
  import TabExploration19 from '$lib/explorations/tabs/TabExploration19_SideNotch.svelte';
  import TabExploration20 from '$lib/explorations/tabs/TabExploration20_AuroraGlow.svelte';

  const { Story } = defineMeta({
    title: 'Design Explorations/Tab Designs',
    component: ExplorationWrapper,
    parameters: {
      layout: 'fullscreen',
    },
  });
</script>

<Story name="01 Pill Tabs" exportName="PillTabs">
  <TabExploration01 />
</Story>

<Story name="02 Underline Glow" exportName="UnderlineGlow">
  <TabExploration02 />
</Story>

<Story name="03 Floating Cards" exportName="FloatingCards">
  <TabExploration03 />
</Story>

<Story name="04 Neon Outline" exportName="NeonOutline">
  <TabExploration04 />
</Story>

<Story name="05 Bubble Pop" exportName="BubblePop">
  <TabExploration05 />
</Story>

<Story name="06 Folder Tabs" exportName="FolderTabs">
  <TabExploration06 />
</Story>

<Story name="07 Slash Diagonal" exportName="SlashDiagonal">
  <TabExploration07 />
</Story>

<Story name="08 Dot Indicator" exportName="DotIndicator">
  <TabExploration08 />
</Story>

<Story name="09 Tag Label" exportName="TagLabel">
  <TabExploration09 />
</Story>

<Story name="10 Ribbon Tabs" exportName="RibbonTabs">
  <TabExploration10 />
</Story>

<Story name="11 Terminal Tabs" exportName="TerminalTabs">
  <TabExploration11 />
</Story>

<Story name="12 Glass Tabs" exportName="GlassTabs">
  <TabExploration12 />
</Story>

<Story name="13 Brutalist Tabs" exportName="BrutalistTabs">
  <TabExploration13 />
</Story>

<Story name="14 Wave Tabs" exportName="WaveTabs">
  <TabExploration14 />
</Story>

<Story name="15 Segmented Control" exportName="SegmentedControl">
  <TabExploration15 />
</Story>

<Story name="16 Gradient Mesh" exportName="GradientMesh">
  <TabExploration16 />
</Story>

<Story name="17 Chip Tabs" exportName="ChipTabs">
  <TabExploration17 />
</Story>

<Story name="18 Stacked Cards" exportName="StackedCards">
  <TabExploration18 />
</Story>

<Story name="19 Side Notch" exportName="SideNotch">
  <TabExploration19 />
</Story>

<Story name="20 Aurora Glow" exportName="AuroraGlow">
  <TabExploration20 />
</Story>
