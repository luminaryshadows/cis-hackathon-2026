# FeedLens credits

| Component | How the branch uses it |
| --- | --- |
| [FeedLens prototype](https://github.com/yg-gms/feedlens-demo) | The team’s original catalog, illustrations, ranking engine and four interactive views provide the shared model for the replay. |
| [Inside your phone](https://inside-your-phone-cis-lab.luminaryshadow.chatgpt.site) | The opening uses the team’s phone turntable, 24 poses rendered with the catalog’s “Pocket-sized nostalgia” cover on the handset display, damped spring, black stage and copper instrument controls. FeedLens computes the recommendation shown alongside it. |
| DM Sans and STIX Two Text | The phone site’s control and display typefaces are bundled under the SIL Open Font License. [DM Sans notice](../FeedLens/public/licenses/dm-sans.txt) · [STIX notice](../FeedLens/public/licenses/stix-two.txt) |
| [React and React DOM](https://react.dev/) | The four views read one session so a reaction, score inspection and alternate history refer to the same events. |
| [Vite](https://vite.dev/) | Vite bundles the app and static assets. The portable build embeds them in one HTML file for offline judging. |
| [Playwright](https://playwright.dev/) | Browser tests exercise the production build with pointer and keyboard controls, including a mobile viewport with reduced motion. |

The turntable uses the first 24 poses from the hardware tour. Each WebP holds six frames. Moving the watch-time slider sets a target pose. The spring moves the display to it while the engine calculates the interest score immediately. With reduced motion enabled, the phone shows the target frame directly.
