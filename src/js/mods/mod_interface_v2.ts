import { Loader } from "@/core/loader";
import { AtlasSprite, REQUIRED_SPRITE_SCALES, SpriteAtlasLink } from "@/core/sprites";
import { Mod } from "./mod";
import { ModInterface } from "./mod_interface";
import { ModLoader } from "./modloader";

export class ModInterfaceV2 extends ModInterface {
    private readonly mod: Mod;
    private readonly baseUrl: string;

    constructor(mod: Mod, modLoader: ModLoader) {
        super(modLoader);
        this.mod = mod;
        this.baseUrl = `mod://${mod.id}`;
    }

    resolve(path: string) {
        path = path
            .split("/")
            .map(p => encodeURIComponent(p))
            .join("/");

        if (!path.startsWith("./")) {
            // Assume relative if not specified
            path = `./${path}`;
        }

        // Cannot use import.meta in webpack context
        return new URL(path, this.baseUrl).toString();
    }

    addStylesheet(path: string) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = this.resolve(path);
        link.setAttribute("data-mod-id", this.mod.id);

        document.head.append(link);
    }

    loadImage(path: string): Promise<HTMLImageElement> {
        const url = this.resolve(path);

        return new Promise((resolve, reject) => {
            const image = new Image();
            image.src = url;

            image.addEventListener("load", () => {
                resolve(image);
            });

            image.addEventListener("error", ev => {
                reject(new Error(`Image "${url}" failed to load`, { cause: ev.error }));
            });
        });
    }

    async registerSprite(id: string, path: string) {
        const image = await this.loadImage(path);

        const link = new SpriteAtlasLink({
            atlas: image,
            w: image.width,
            h: image.height,
            packedW: image.width,
            packedH: image.height,
            packedX: 0,
            packedY: 0,
            packOffsetX: 0,
            packOffsetY: 0,
        });

        const sprite = new AtlasSprite(id);
        sprite.frozen = true;

        for (const scale of REQUIRED_SPRITE_SCALES) {
            sprite.linksByResolution[scale] = link;
        }

        Loader.sprites.set(id, sprite);
    }
}
