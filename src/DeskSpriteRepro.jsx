import deskScene from './assets/deskScene.svg';

export default function DeskSpriteRepro() {
  return (
    <img
      src={deskScene}
      alt="Pixel-art illustration of a developer at a desk with a monitor, coffee mug, desk lamp, and a dinosaur wearing headphones"
      className="h-auto w-full [filter:var(--sprite-filter)]"
    />
  );
}
