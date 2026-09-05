# Government artwork

Place the official **State Emblem of India** here as `emblem.svg` (or `emblem.png`),
then switch it on in `.env`:

    NEXT_PUBLIC_GOV_EMBLEM_SRC="/gov/emblem.svg"

It then appears in the public masthead and as the sidebar brand mark.

Nothing is committed to this folder. The emblem is restricted by the State
Emblem of India (Prohibition of Improper Use) Act, 2005, so supplying it is a
decision for the team deploying the service. With the variable unset, the
masthead stays typographic and the sidebar keeps its own mark — there is never
a broken image.
