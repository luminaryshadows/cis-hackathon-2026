# FeedLens credits

| Component | How the branch uses it |
| --- | --- |
| [FeedLens prototype](https://github.com/yg-gms/feedlens-demo) | The team’s original ranking engine and four interactive views provide the shared model for the replay. |
| [Inside your phone](https://inside-your-phone-cis-lab.luminaryshadow.chatgpt.site) | The opening uses the team’s phone turntable, 24 poses rendered with the catalog’s Svalbard laser photograph on the handset display, damped spring, black stage and copper instrument controls. FeedLens computes the recommendation shown alongside it. |
| DM Sans and STIX Two Text | The phone site’s control and display typefaces are bundled under the SIL Open Font License. [DM Sans notice](../FeedLens/public/licenses/dm-sans.txt) · [STIX notice](../FeedLens/public/licenses/stix-two.txt) |
| [React and React DOM](https://react.dev/) | The four views read one session so a reaction, score inspection and alternate history refer to the same events. |
| [Vite](https://vite.dev/) | Vite bundles the app and static assets. The portable build embeds them in one HTML file for offline judging. |
| [Playwright](https://playwright.dev/) | Browser tests exercise the production build with pointer and keyboard controls, including a mobile viewport with reduced motion. |
| [zip.js](https://github.com/gildas-lormeau/zip.js) | Reads the selected activity entries from local Instagram ZIP files. The same reader is bundled into the offline demo. [BSD 3-Clause notice](../FeedLens/public/licenses/zip-js.txt) |
| [For You Data Hub](https://github.com/pwikstrom/foryou-research/blob/main/fyp/ingest/instagram.py) | The public export reader and its [synthetic tests](https://github.com/pwikstrom/foryou-research/blob/main/tests/unit/test_instagram_ddp_ingest.py) helped identify Instagram’s activity file layouts. The sample in FeedLens uses fictional records. |

Each story links to its publisher, credited photograph, and reuse terms. Both the website and offline demo include the complete photo-credit list.

The turntable uses the first 24 poses from the hardware tour. Each WebP holds six frames. Scrolling past the phone sets the watch duration. The visitor can override it with the slider. The spring turns the phone to the matching pose while the engine calculates the interest score. With reduced motion enabled, the phone shows the target frame directly.
