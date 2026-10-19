import { useShaderTweaks } from "../lib/tweaks-store";
import Grainient from "./vendor/reactbits/Grainient";

/** Darkroom background: the pen palette (room, deep sage, sage, ember) on a grain shader that follows the pointer. */
export default function HeroShader() {
	const tweaks = useShaderTweaks();
	return (
		<Grainient
			colors={tweaks.colors}
			type="radial"
			speed={tweaks.speed}
			flow={tweaks.flow}
			softness={tweaks.softness}
			silk={tweaks.silk}
			grainAmount={tweaks.grainAmount}
			grainSize={1.2}
			interactive={tweaks.interactive}
			stir={tweaks.stir}
			clickSwirl={tweaks.clickSwirl}
			intro
			dpr={1.5}
		/>
	);
}
