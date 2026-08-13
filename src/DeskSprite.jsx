import deskSceneUrl from './assets/deskScene.svg';

// Static trace of the reference desk-scene illustration. Animation (typing
// hands, blink, coffee-sip arm) comes later as isolated overlay shapes on
// top of this base — for now it's shown as-is.
export default function DeskSprite() {
  return (
    <img
      src={deskSceneUrl}
      alt="Pixel-art illustration of a developer at a desk with a monitor, coffee mug, desk lamp, and a dinosaur wearing headphones"
      className="h-auto w-full max-w-[520px] [filter:var(--sprite-filter)]"
    />
  );
}
