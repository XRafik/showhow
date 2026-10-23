export interface TrayIconSpec {
	/** File in the public directory. */
	file: string;
	/** macOS template image: black + alpha, recoloured by the menu bar for light and dark. */
	template: boolean;
	/** Pixel size to resize to, or null to keep the 16 pt + @2x pair nativeImage loads itself. */
	size: number | null;
}

/** Idle and recording tray icons for a platform. macOS uses the 16 pt template pair; others a 24 px colour icon. */
export function trayIconSpecs(platform: NodeJS.Platform): {
	idle: TrayIconSpec;
	recording: TrayIconSpec;
} {
	if (platform === "darwin") {
		return {
			idle: { file: "trayTemplate.png", template: true, size: null },
			recording: { file: "tray-recording.png", template: false, size: null },
		};
	}
	return {
		idle: { file: "showhow.png", template: false, size: 24 },
		recording: { file: "tray-recording@2x.png", template: false, size: 24 },
	};
}
