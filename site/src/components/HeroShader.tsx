import Grainient from "./vendor/reactbits/Grainient";

/** Darkroom background: the pen palette (room, deep sage, sage, ember) on a grain shader that follows the pointer. */
export default function HeroShader() {
	return (
		<Grainient
			colors={["#161616", "#1F3A31", "#82B09A", "#E3582D"]}
			type="radial"
			speed={0.55}
			flow={0.7}
			softness={1.2}
			silk={0.4}
			grainAmount={0.12}
			grainSize={1.2}
			interactive
			stir={1.4}
			clickSwirl
			intro
			dpr={1.5}
		/>
	);
}
